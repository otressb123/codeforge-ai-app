import { useEffect, useRef, useState } from "react";
import { Users, LogIn, LogOut, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Peer {
  id: string;
  name: string;
  color: string;
  file?: string;
  line?: number;
  column?: number;
  joinedAt: number;
}

const COLORS = ["#06b6d4", "#a855f7", "#ec4899", "#f59e0b", "#10b981", "#ef4444", "#3b82f6", "#8b5cf6"];
const LS_KEY = "codeforge-collab";

interface CollabPanelProps {
  currentFile?: string;
  cursorLine?: number;
  cursorColumn?: number;
}

const CollabPanel = ({ currentFile, cursorLine, cursorColumn }: CollabPanelProps) => {
  const [roomId, setRoomId] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [joined, setJoined] = useState(false);
  const [peers, setPeers] = useState<Peer[]>([]);
  const [copied, setCopied] = useState(false);
  const channelRef = useRef<any>(null);
  const selfRef = useRef<Peer | null>(null);

  // Load last room/name
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const { room, displayName } = JSON.parse(raw);
        if (room) setRoomId(room);
        if (displayName) setName(displayName);
      }
    } catch {}
  }, []);

  // Track cursor changes
  useEffect(() => {
    if (!joined || !channelRef.current || !selfRef.current) return;
    selfRef.current = {
      ...selfRef.current,
      file: currentFile,
      line: cursorLine,
      column: cursorColumn,
    };
    channelRef.current.track(selfRef.current);
  }, [currentFile, cursorLine, cursorColumn, joined]);

  const join = async () => {
    if (!roomId.trim() || !name.trim()) {
      toast.error("Enter a room ID and your name");
      return;
    }
    const room = roomId.trim();
    const displayName = name.trim();
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const me: Peer = {
      id: crypto.randomUUID(),
      name: displayName,
      color,
      joinedAt: Date.now(),
      file: currentFile,
      line: cursorLine,
      column: cursorColumn,
    };
    selfRef.current = me;

    const channel = supabase.channel(`collab:${room}`, {
      config: { presence: { key: me.id } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState() as Record<string, Peer[]>;
        const list: Peer[] = [];
        Object.values(state).forEach((entries) => {
          entries.forEach((p) => list.push(p));
        });
        setPeers(list.sort((a, b) => a.joinedAt - b.joinedAt));
      })
      .on("presence", { event: "join" }, ({ newPresences }: any) => {
        newPresences.forEach((p: Peer) => {
          if (p.id !== me.id) toast.info(`${p.name} joined the room`);
        });
      })
      .on("presence", { event: "leave" }, ({ leftPresences }: any) => {
        leftPresences.forEach((p: Peer) => {
          if (p.id !== me.id) toast.info(`${p.name} left the room`);
        });
      })
      .subscribe(async (status: string) => {
        if (status === "SUBSCRIBED") {
          await channel.track(me);
          setJoined(true);
          toast.success(`Joined room "${room}"`);
          localStorage.setItem(LS_KEY, JSON.stringify({ room, displayName }));
        }
      });

    channelRef.current = channel;
  };

  const leave = async () => {
    if (channelRef.current) {
      await channelRef.current.unsubscribe();
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    selfRef.current = null;
    setJoined(false);
    setPeers([]);
    toast.info("Left collaboration room");
  };

  useEffect(() => () => {
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      supabase.removeChannel(channelRef.current);
    }
  }, []);

  const copyRoom = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const others = peers.filter((p) => p.id !== selfRef.current?.id);

  return (
    <div className="h-full flex flex-col bg-sidebar text-foreground">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <Users className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold">Collaboration</h2>
        {joined && (
          <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-success/20 text-success border border-success/30">
            LIVE
          </span>
        )}
      </div>

      <div className="p-4 space-y-3 flex-1 overflow-y-auto">
        {!joined ? (
          <>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Your name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Dev"
                className="w-full bg-background border border-border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Room ID</label>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="team-codeforge"
                className="w-full bg-background border border-border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Share this ID with teammates. Anyone using the same room sees each other live.
              </p>
            </div>
            <button
              onClick={join}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded px-3 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Join Room
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 p-2 rounded bg-background/50 border border-border">
              <span className="text-xs text-muted-foreground">Room:</span>
              <code className="text-xs text-primary font-mono flex-1 truncate">{roomId}</code>
              <button
                onClick={copyRoom}
                className="p-1 rounded hover:bg-secondary/50 transition-colors"
                title="Copy room ID"
              >
                {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>

            <div>
              <h3 className="text-xs font-medium text-muted-foreground mb-2">
                Active users ({peers.length})
              </h3>
              <div className="space-y-1.5">
                {peers.map((p) => {
                  const isMe = p.id === selfRef.current?.id;
                  return (
                    <div
                      key={p.id}
                      className="flex items-center gap-2 p-2 rounded bg-background/50 border border-border"
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-full ring-2 ring-background"
                        style={{ background: p.color }}
                      />
                      <span className="text-sm font-medium truncate">
                        {p.name} {isMe && <span className="text-muted-foreground text-xs">(you)</span>}
                      </span>
                      {p.file && (
                        <span className="ml-auto text-[10px] text-muted-foreground truncate max-w-[120px]">
                          {p.file.split("/").pop()}
                          {p.line ? `:${p.line}` : ""}
                        </span>
                      )}
                    </div>
                  );
                })}
                {others.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    Waiting for teammates… share the room ID.
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={leave}
              className="w-full flex items-center justify-center gap-2 bg-destructive/20 text-destructive border border-destructive/30 rounded px-3 py-2 text-sm font-medium hover:bg-destructive/30 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Leave Room
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default CollabPanel;

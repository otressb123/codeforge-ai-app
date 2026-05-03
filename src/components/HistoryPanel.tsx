import { useState, useEffect } from "react";
import { History, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { loadHistory, clearHistory, type Snapshot } from "@/lib/projectHistory";
import type { FileNode } from "@/components/FileExplorer";

interface HistoryPanelProps {
  onRestore: (files: FileNode[]) => void;
}

const HistoryPanel = ({ onRestore }: HistoryPanelProps) => {
  const [snaps, setSnaps] = useState<Snapshot[]>([]);

  const refresh = () => setSnaps(loadHistory().slice().reverse());
  useEffect(() => {
    refresh();
    const i = setInterval(refresh, 2000);
    return () => clearInterval(i);
  }, []);

  const handleRestore = (s: Snapshot) => {
    onRestore(s.files);
    toast.success(`⏪ Restored: ${s.label}`);
  };

  const handleClear = () => {
    clearHistory();
    setSnaps([]);
    toast.success("History cleared");
  };

  const fmt = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  return (
    <div className="h-full bg-sidebar overflow-y-auto scrollbar-thin">
      <div className="p-3 border-b border-border flex items-center justify-between">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <History className="w-3.5 h-3.5 text-primary" />
          Version History
        </h2>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleClear} title="Clear history">
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
      <div className="p-2 space-y-1">
        {snaps.length === 0 && (
          <p className="text-[11px] text-muted-foreground p-3 text-center">
            No snapshots yet. Each AI change creates one automatically.
          </p>
        )}
        {snaps.map((s) => (
          <div
            key={s.id}
            className="group flex items-start gap-2 p-2 rounded hover:bg-accent/40 cursor-pointer transition-colors"
            onClick={() => handleRestore(s)}
          >
            <RotateCcw className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{s.label}</p>
              <p className="text-[10px] text-muted-foreground">{fmt(s.ts)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryPanel;

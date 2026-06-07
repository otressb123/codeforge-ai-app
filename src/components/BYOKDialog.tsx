import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { KeyRound, Plus, Trash2, ShieldCheck, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { loadBYOK, addBYOK, removeBYOK, BYOK_PRESETS, type BYOKProvider } from "@/lib/byok";

interface BYOKDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onChanged?: () => void;
}

const BYOKDialog = ({ open, onOpenChange, onChanged }: BYOKDialogProps) => {
  const [list, setList] = useState<BYOKProvider[]>([]);
  const [name, setName] = useState("");
  const [baseUrl, setBaseUrl] = useState(BYOK_PRESETS[0].baseUrl);
  const [model, setModel] = useState(BYOK_PRESETS[0].modelHint);
  const [apiKey, setApiKey] = useState("");

  useEffect(() => {
    if (open) setList(loadBYOK());
  }, [open]);

  const handleAdd = () => {
    if (!name.trim() || !baseUrl.trim() || !apiKey.trim() || !model.trim()) {
      toast.error("Fill in all fields");
      return;
    }
    addBYOK({ name: name.trim(), baseUrl: baseUrl.trim().replace(/\/$/, ""), apiKey: apiKey.trim(), model: model.trim() });
    setList(loadBYOK());
    setName(""); setApiKey("");
    toast.success(`Added ${name}`);
    onChanged?.();
  };

  const handleRemove = (id: string) => {
    removeBYOK(id);
    setList(loadBYOK());
    onChanged?.();
  };

  const applyPreset = (preset: typeof BYOK_PRESETS[0]) => {
    setBaseUrl(preset.baseUrl);
    setModel(preset.modelHint);
    if (!name) setName(preset.name);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-primary" />
            Bring Your Own AI Key
          </DialogTitle>
          <DialogDescription>
            Connect any OpenAI-compatible provider with your own API key. Keys are stored
            locally in your browser (localStorage) and sent directly to the provider — never
            to CodeForge servers.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-success/30 bg-success/5 p-3 flex gap-2 text-xs">
          <ShieldCheck className="w-4 h-4 text-success shrink-0 mt-0.5" />
          <div className="text-muted-foreground">
            Your key never leaves your browser. Requests go straight from your machine to
            the provider's endpoint. Don't paste keys in public chats or commits.
          </div>
        </div>

        {/* Presets */}
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Quick presets</Label>
          <div className="flex flex-wrap gap-1.5">
            {BYOK_PRESETS.map((p) => (
              <Badge
                key={p.name}
                variant="outline"
                className="cursor-pointer hover:bg-accent"
                onClick={() => applyPreset(p)}
              >
                {p.name}
              </Badge>
            ))}
          </div>
        </div>

        {/* Add form */}
        <div className="space-y-3 rounded-lg border border-border p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Display name</Label>
              <Input placeholder="My OpenAI" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Model ID</Label>
              <Input placeholder="gpt-4o-mini" value={model} onChange={(e) => setModel(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Base URL (OpenAI-compatible)</Label>
            <Input placeholder="https://api.openai.com/v1" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">API key</Label>
            <Input type="password" placeholder="sk-..." value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
          </div>
          <Button onClick={handleAdd} className="w-full gap-2">
            <Plus className="w-4 h-4" /> Add provider
          </Button>
        </div>

        {/* List */}
        {list.length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Configured providers</Label>
            {list.map((p) => (
              <div key={p.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{p.name}</span>
                    <Badge variant="secondary" className="text-[10px]">{p.model}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                    <ExternalLink className="w-3 h-3 shrink-0" /> {p.baseUrl}
                  </div>
                </div>
                <Button size="icon" variant="ghost" onClick={() => handleRemove(p.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BYOKDialog;

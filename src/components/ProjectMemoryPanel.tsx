import { useState, useEffect } from "react";
import { Brain, Save, Trash2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { loadProjectMemory, saveProjectMemory, clearProjectMemory, emptyMemory, type ProjectMemory } from "@/lib/projectMemory";

const ProjectMemoryPanel = () => {
  const [mem, setMem] = useState<ProjectMemory>(emptyMemory());
  const [newStack, setNewStack] = useState("");
  const [newFeature, setNewFeature] = useState("");

  useEffect(() => {
    setMem(loadProjectMemory());
  }, []);

  const handleSave = () => {
    saveProjectMemory(mem);
    toast.success("🧠 Project memory saved — AI will use it on next message");
  };

  const handleClear = () => {
    clearProjectMemory();
    setMem(emptyMemory());
    toast.success("Memory cleared");
  };

  const addItem = (key: "stack" | "features", value: string, reset: () => void) => {
    const v = value.trim();
    if (!v) return;
    setMem((m) => ({ ...m, [key]: [...m[key], v] }));
    reset();
  };

  const removeItem = (key: "stack" | "features", idx: number) => {
    setMem((m) => ({ ...m, [key]: m[key].filter((_, i) => i !== idx) }));
  };

  return (
    <div className="h-full bg-sidebar overflow-y-auto scrollbar-thin">
      <div className="p-3 border-b border-border flex items-center justify-between">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Brain className="w-3.5 h-3.5 text-primary" />
          Project Memory
        </h2>
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleClear} title="Clear memory">
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-primary" onClick={handleSave} title="Save">
            <Save className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <div className="p-3 space-y-4 text-sm">
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          The AI sees this on every message. Tell it what you're building, your stack, design taste, and key features.
        </p>

        <div>
          <label className="text-xs font-medium text-foreground/80 mb-1 block">Purpose</label>
          <Textarea
            value={mem.purpose}
            onChange={(e) => setMem({ ...mem, purpose: e.target.value })}
            placeholder="e.g. A Spotify-like music player for indie artists"
            className="min-h-[60px] text-xs"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-foreground/80 mb-1 block">Tech Stack</label>
          <div className="flex flex-wrap gap-1 mb-2">
            {mem.stack.map((s, i) => (
              <span key={i} className="inline-flex items-center gap-1 bg-secondary px-2 py-0.5 rounded text-[11px]">
                {s}
                <button onClick={() => removeItem("stack", i)} className="hover:text-destructive">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-1">
            <Input
              value={newStack}
              onChange={(e) => setNewStack(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addItem("stack", newStack, () => setNewStack(""))}
              placeholder="Add tech…"
              className="h-7 text-xs"
            />
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => addItem("stack", newStack, () => setNewStack(""))}>
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-foreground/80 mb-1 block">Design Direction</label>
          <Textarea
            value={mem.design}
            onChange={(e) => setMem({ ...mem, design: e.target.value })}
            placeholder="e.g. Dark glassmorphism, cyan accents, generous spacing"
            className="min-h-[60px] text-xs"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-foreground/80 mb-1 block">Features</label>
          <div className="flex flex-wrap gap-1 mb-2">
            {mem.features.map((f, i) => (
              <span key={i} className="inline-flex items-center gap-1 bg-primary/15 text-primary px-2 py-0.5 rounded text-[11px]">
                {f}
                <button onClick={() => removeItem("features", i)} className="hover:text-destructive">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-1">
            <Input
              value={newFeature}
              onChange={(e) => setNewFeature(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addItem("features", newFeature, () => setNewFeature(""))}
              placeholder="Add feature…"
              className="h-7 text-xs"
            />
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => addItem("features", newFeature, () => setNewFeature(""))}>
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-foreground/80 mb-1 block">Notes</label>
          <Textarea
            value={mem.notes}
            onChange={(e) => setMem({ ...mem, notes: e.target.value })}
            placeholder="Anything else the AI should know…"
            className="min-h-[60px] text-xs"
          />
        </div>

        <Button onClick={handleSave} className="w-full gap-2" size="sm">
          <Save className="w-3.5 h-3.5" />
          Save Memory
        </Button>
      </div>
    </div>
  );
};

export default ProjectMemoryPanel;

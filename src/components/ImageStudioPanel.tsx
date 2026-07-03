import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, Download, Trash2, Copy, Check, ImageIcon, Wand2, KeyRound, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { loadBYOK, type BYOKProvider } from "@/lib/byok";
import BYOKDialog from "@/components/BYOKDialog";

type Preset = {
  id: string;
  label: string;
  icon: string;
  hint: string;
  suffix: string;
};

const PRESETS: Preset[] = [
  { id: "texture", label: "Texture", icon: "🧱", hint: "seamless brick wall", suffix: ", seamless tileable PBR texture, 4k, top-down, no lighting" },
  { id: "concept", label: "Concept Art", icon: "🎨", hint: "cyberpunk alley at night", suffix: ", concept art, dramatic lighting, cinematic composition, high detail" },
  { id: "anime", label: "Anime Character", icon: "🌸", hint: "shy schoolgirl with pink hair", suffix: ", anime style, full body character sheet, clean lineart, cel shading, neutral pose" },
  { id: "human", label: "Human Model Ref", icon: "🧍", hint: "athletic male warrior", suffix: ", realistic human character reference, full body T-pose, neutral background, front view" },
  { id: "ui", label: "UI Mockup", icon: "📱", hint: "modern crypto dashboard", suffix: ", clean modern UI design mockup, flat, minimal, high contrast, product design" },
  { id: "icon", label: "Icon / Logo", icon: "✨", hint: "rocket app icon", suffix: ", simple flat vector icon, centered, solid background, iOS style" },
  { id: "sprite", label: "Game Sprite", icon: "👾", hint: "8-bit knight", suffix: ", pixel art game sprite, transparent background, side view, sprite sheet friendly" },
  { id: "env", label: "Environment", icon: "🏙️", hint: "floating island city", suffix: ", detailed environment concept, wide shot, atmospheric perspective" },
];

type StoredImage = {
  id: string;
  url: string;   // data url or remote
  prompt: string;
  preset: string;
  createdAt: number;
};

const GALLERY_KEY = "codeforge:image-gallery:v1";

function loadGallery(): StoredImage[] {
  try {
    const raw = localStorage.getItem(GALLERY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
function saveGallery(list: StoredImage[]) {
  try { localStorage.setItem(GALLERY_KEY, JSON.stringify(list.slice(0, 40))); } catch {}
}

interface Props {
  onAddAsset?: (name: string, dataUrl: string) => void;
}

const ImageStudioPanel = ({ onAddAsset }: Props) => {
  const [prompt, setPrompt] = useState("");
  const [preset, setPreset] = useState<Preset>(PRESETS[1]);
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState<string | null>(null);
  const [gallery, setGallery] = useState<StoredImage[]>([]);
  const [byokOpen, setByokOpen] = useState(false);
  const [byokList, setByokList] = useState<BYOKProvider[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const refImageRef = useRef<HTMLInputElement>(null);
  const [refImage, setRefImage] = useState<string | null>(null);

  useEffect(() => { setGallery(loadGallery()); setByokList(loadBYOK()); }, []);

  const byokImageProvider = byokList.find(
    (p) => /openai|together|openrouter/i.test(p.name) || /openai\.com|together\.xyz|openrouter/i.test(p.baseUrl)
  );

  const buildPrompt = () => {
    const base = prompt.trim() || preset.hint;
    return base + preset.suffix;
  };

  const generate = async () => {
    const finalPrompt = buildPrompt();
    if (!finalPrompt) return;
    setLoading(true);
    setCurrent(null);
    try {
      let dataUrl: string | null = null;

      // Try BYOK OpenAI first if available (bypass Lovable credits)
      if (byokImageProvider && /openai\.com/i.test(byokImageProvider.baseUrl)) {
        try {
          const r = await fetch(`${byokImageProvider.baseUrl}/images/generations`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${byokImageProvider.apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "gpt-image-1",
              prompt: finalPrompt,
              size: "1024x1024",
              n: 1,
            }),
          });
          if (r.ok) {
            const j = await r.json();
            const b64 = j.data?.[0]?.b64_json;
            const url = j.data?.[0]?.url;
            dataUrl = b64 ? `data:image/png;base64,${b64}` : url;
          } else {
            const err = await r.text();
            console.warn("BYOK image error, falling back to Lovable:", err);
          }
        } catch (e) {
          console.warn("BYOK image failed:", e);
        }
      }

      // Fallback: Lovable edge function (gemini nano banana)
      if (!dataUrl) {
        const { data, error } = await supabase.functions.invoke("image-gen", {
          body: { prompt: finalPrompt, image: refImage ?? undefined },
        });
        if (error) {
          const msg = (error as any).message ?? "Image generation failed";
          if (msg.includes("402") || /credit/i.test(msg)) {
            toast.error("AI credits exhausted", {
              description: "Add an OpenAI BYOK key to keep generating images.",
              action: { label: "Add key", onClick: () => setByokOpen(true) },
            });
          } else if (msg.includes("429")) {
            toast.error("Rate limited — try again in a moment");
          } else {
            toast.error(msg);
          }
          setLoading(false);
          return;
        }
        dataUrl = data?.url ?? null;
      }

      if (!dataUrl) {
        toast.error("No image returned");
        setLoading(false);
        return;
      }

      setCurrent(dataUrl);
      const entry: StoredImage = {
        id: crypto.randomUUID(),
        url: dataUrl,
        prompt: finalPrompt,
        preset: preset.id,
        createdAt: Date.now(),
      };
      const next = [entry, ...gallery];
      setGallery(next);
      saveGallery(next);
      toast.success("Image generated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRefUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setRefImage(reader.result as string);
    reader.readAsDataURL(f);
  };

  const download = (url: string, name = "image.png") => {
    const a = document.createElement("a");
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
  };

  const copyPrompt = async (p: string, id: string) => {
    await navigator.clipboard.writeText(p);
    setCopied(id);
    setTimeout(() => setCopied(null), 1200);
  };

  const removeFromGallery = (id: string) => {
    const next = gallery.filter((g) => g.id !== id);
    setGallery(next); saveGallery(next);
  };

  const sendToAssets = (img: StoredImage) => {
    if (!onAddAsset) { toast.info("Open the Assets panel to import"); return; }
    const name = `${img.preset}-${img.id.slice(0, 6)}.png`;
    onAddAsset(name, img.url);
    toast.success(`Added ${name} to assets`);
  };

  return (
    <div className="h-full flex flex-col bg-sidebar">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Wand2 className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <div className="text-sm font-semibold">Image Studio</div>
            <div className="text-[10px] text-muted-foreground">
              {byokImageProvider ? `Using ${byokImageProvider.name}` : "Lovable AI (Gemini)"}
            </div>
          </div>
        </div>
        <Button size="sm" variant="ghost" onClick={() => setByokOpen(true)} title="Bring your own key">
          <KeyRound className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Preset chips */}
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Preset</div>
          <div className="grid grid-cols-4 gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPreset(p)}
                className={`text-[10px] rounded-md border p-1.5 flex flex-col items-center gap-0.5 transition-all ${
                  preset.id === p.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50 text-muted-foreground"
                }`}
              >
                <span className="text-base leading-none">{p.icon}</span>
                <span className="truncate w-full text-center">{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Prompt */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Prompt</div>
            <Badge variant="outline" className="text-[9px]">{preset.label} style</Badge>
          </div>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={preset.hint}
            className="min-h-[80px] text-xs resize-none"
          />
        </div>

        {/* Reference image */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Reference (optional)</div>
            {refImage && (
              <button onClick={() => setRefImage(null)} className="text-[10px] text-destructive hover:underline">
                Remove
              </button>
            )}
          </div>
          {refImage ? (
            <img src={refImage} alt="ref" className="w-full h-20 object-cover rounded border border-border" />
          ) : (
            <button
              onClick={() => refImageRef.current?.click()}
              className="w-full h-20 border border-dashed border-border rounded flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            >
              <Upload className="w-3 h-3" /> Upload reference
            </button>
          )}
          <input ref={refImageRef} type="file" accept="image/*" hidden onChange={handleRefUpload} />
        </div>

        <Button onClick={generate} disabled={loading} className="w-full gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? "Generating..." : "Generate Image"}
        </Button>

        {/* Current */}
        <AnimatePresence>
          {current && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border border-primary/30 overflow-hidden"
            >
              <img src={current} alt="generated" className="w-full" />
              <div className="p-2 flex gap-1 bg-card">
                <Button size="sm" variant="ghost" className="flex-1 gap-1 text-xs" onClick={() => download(current, `${preset.id}.png`)}>
                  <Download className="w-3 h-3" /> Save
                </Button>
                {onAddAsset && (
                  <Button size="sm" variant="ghost" className="flex-1 gap-1 text-xs" onClick={() => sendToAssets(gallery[0])}>
                    <ImageIcon className="w-3 h-3" /> To Assets
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Gallery */}
        {gallery.length > 0 && (
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 flex justify-between items-center">
              <span>Gallery ({gallery.length})</span>
              <button
                onClick={() => { setGallery([]); saveGallery([]); toast.success("Cleared"); }}
                className="text-[10px] text-destructive hover:underline"
              >Clear all</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {gallery.map((img) => (
                <div key={img.id} className="relative group rounded-md overflow-hidden border border-border">
                  <img src={img.url} alt={img.prompt} className="w-full aspect-square object-cover" />
                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col p-1.5 gap-1">
                    <div className="text-[9px] text-white line-clamp-3 flex-1">{img.prompt}</div>
                    <div className="flex gap-1">
                      <button onClick={() => download(img.url, `${img.preset}-${img.id.slice(0,6)}.png`)} className="flex-1 bg-white/10 hover:bg-white/20 rounded p-1 text-white" title="Download">
                        <Download className="w-3 h-3 mx-auto" />
                      </button>
                      <button onClick={() => copyPrompt(img.prompt, img.id)} className="flex-1 bg-white/10 hover:bg-white/20 rounded p-1 text-white" title="Copy prompt">
                        {copied === img.id ? <Check className="w-3 h-3 mx-auto" /> : <Copy className="w-3 h-3 mx-auto" />}
                      </button>
                      {onAddAsset && (
                        <button onClick={() => sendToAssets(img)} className="flex-1 bg-white/10 hover:bg-white/20 rounded p-1 text-white" title="Send to Assets">
                          <ImageIcon className="w-3 h-3 mx-auto" />
                        </button>
                      )}
                      <button onClick={() => removeFromGallery(img.id)} className="flex-1 bg-destructive/40 hover:bg-destructive/60 rounded p-1 text-white" title="Delete">
                        <Trash2 className="w-3 h-3 mx-auto" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <BYOKDialog open={byokOpen} onOpenChange={setByokOpen} onChanged={() => setByokList(loadBYOK())} />
    </div>
  );
};

export default ImageStudioPanel;

// 2D anime drawing + frame-by-frame animation. Works fully offline.
import { useCallback, useEffect, useRef, useState } from "react";
import { Brush, Eraser, Plus, Copy, Trash2, Play, Pause, Download, Save, FolderOpen, Film, PaintBucket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

const W = 640, H = 360;
const STORE = "codeforge.anime2d.v1";
const PALETTE = ["#0f172a", "#ffffff", "#ffe4c4", "#f4c9a0", "#ec4899", "#7c3aed", "#0ea5e9", "#22c55e", "#facc15", "#ef4444", "#78350f", "#94a3b8"];

const blank = () => {
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  return c.toDataURL();
};
const loadImg = (src: string) => new Promise<HTMLImageElement>((res) => { const i = new Image(); i.onload = () => res(i); i.src = src; });

const Anime2DStudio = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onionRef = useRef<HTMLCanvasElement>(null);
  const [frames, setFrames] = useState<string[]>(() => [blank()]);
  const [cur, setCur] = useState(0);
  const [tool, setTool] = useState<"brush" | "eraser" | "fill">("brush");
  const [color, setColor] = useState("#0f172a");
  const [size, setSize] = useState(4);
  const [fps, setFps] = useState(8);
  const [onion, setOnion] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [bg, setBg] = useState("#ffffff");
  const drawing = useRef(false);
  const last = useRef<[number, number] | null>(null);

  const ctx = () => canvasRef.current!.getContext("2d")!;

  // Draw the current frame (and onion skin of the previous one)
  const paintFrame = useCallback(async (i: number) => {
    const c = ctx(); c.clearRect(0, 0, W, H);
    c.drawImage(await loadImg(frames[i]), 0, 0);
    const o = onionRef.current?.getContext("2d"); if (!o) return;
    o.clearRect(0, 0, W, H);
    if (onion && !playing && i > 0) { o.globalAlpha = 0.25; o.drawImage(await loadImg(frames[i - 1]), 0, 0); o.globalAlpha = 1; }
  }, [frames, onion, playing]);

  useEffect(() => { paintFrame(cur); }, [cur, paintFrame]);

  const commit = () => {
    const url = canvasRef.current!.toDataURL();
    setFrames((f) => f.map((x, i) => (i === cur ? url : x)));
  };

  const pos = (e: React.PointerEvent): [number, number] => {
    const r = canvasRef.current!.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H];
  };

  const floodFill = (x: number, y: number) => {
    const c = ctx(); const img = c.getImageData(0, 0, W, H); const d = img.data;
    const idx = (Math.floor(y) * W + Math.floor(x)) * 4;
    const target = [d[idx], d[idx + 1], d[idx + 2], d[idx + 3]];
    const hex = color.replace("#", ""); const fill = [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16), 255];
    if (target.every((v, i) => v === fill[i])) return;
    const match = (i: number) => Math.abs(d[i] - target[0]) < 40 && Math.abs(d[i + 1] - target[1]) < 40 && Math.abs(d[i + 2] - target[2]) < 40 && Math.abs(d[i + 3] - target[3]) < 40;
    const stack = [[Math.floor(x), Math.floor(y)]];
    while (stack.length) {
      const [px, py] = stack.pop()!;
      if (px < 0 || py < 0 || px >= W || py >= H) continue;
      const i = (py * W + px) * 4; if (!match(i)) continue;
      d[i] = fill[0]; d[i + 1] = fill[1]; d[i + 2] = fill[2]; d[i + 3] = 255;
      stack.push([px + 1, py], [px - 1, py], [px, py + 1], [px, py - 1]);
    }
    c.putImageData(img, 0, 0); commit();
  };

  const down = (e: React.PointerEvent) => {
    if (playing) return;
    const p = pos(e);
    if (tool === "fill") { floodFill(p[0], p[1]); return; }
    drawing.current = true; last.current = p;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    stroke(p, e.pressure || 0.5);
  };
  const stroke = (p: [number, number], pressure: number) => {
    const c = ctx(); const l = last.current ?? p;
    c.globalCompositeOperation = tool === "eraser" ? "destination-out" : "source-over";
    c.strokeStyle = color; c.lineCap = "round"; c.lineJoin = "round";
    c.lineWidth = size * (tool === "eraser" ? 3 : 0.6 + pressure);
    c.beginPath(); c.moveTo(l[0], l[1]); c.lineTo(p[0], p[1]); c.stroke();
    c.globalCompositeOperation = "source-over";
    last.current = p;
  };
  const move = (e: React.PointerEvent) => { if (drawing.current) stroke(pos(e), e.pressure || 0.5); };
  const up = () => { if (drawing.current) { drawing.current = false; last.current = null; commit(); } };

  // Frames
  const addFrame = (dup: boolean) => {
    const f = dup ? frames[cur] : blank();
    setFrames((fr) => [...fr.slice(0, cur + 1), f, ...fr.slice(cur + 1)]);
    setCur(cur + 1);
  };
  const delFrame = () => {
    if (frames.length === 1) { setFrames([blank()]); return; }
    setFrames((fr) => fr.filter((_, i) => i !== cur)); setCur(Math.max(0, cur - 1));
  };

  // Playback
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setCur((c) => (c + 1) % frames.length), 1000 / fps);
    return () => clearInterval(id);
  }, [playing, fps, frames.length]);

  // Export: render all frames (with background) to a video
  const exportVideo = async () => {
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const x = c.getContext("2d")!;
    const imgs = await Promise.all(frames.map(loadImg));
    const rec = new MediaRecorder(c.captureStream(fps), { mimeType: "video/webm" });
    const chunks: Blob[] = []; rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.onstop = () => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(chunks, { type: "video/webm" })); a.download = "anime-2d.webm"; a.click(); toast.success("Video saved: anime-2d.webm"); };
    rec.start();
    for (let loop = 0; loop < 2; loop++) for (const im of imgs) {
      x.fillStyle = bg; x.fillRect(0, 0, W, H); x.drawImage(im, 0, 0);
      await new Promise((r) => setTimeout(r, 1000 / fps));
    }
    rec.stop();
  };
  const exportPNG = async () => {
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const x = c.getContext("2d")!; x.fillStyle = bg; x.fillRect(0, 0, W, H); x.drawImage(await loadImg(frames[cur]), 0, 0);
    const a = document.createElement("a"); a.href = c.toDataURL("image/png"); a.download = `frame-${cur + 1}.png`; a.click();
  };

  const save = () => {
    try { localStorage.setItem(STORE, JSON.stringify({ frames, fps, bg })); toast.success("Saved on this device"); }
    catch { toast.error("Too many frames to save — export a video instead"); }
  };
  const load = () => {
    const raw = localStorage.getItem(STORE); if (!raw) { toast.error("Nothing saved yet"); return; }
    try { const d = JSON.parse(raw); setFrames(d.frames); setFps(d.fps); setBg(d.bg); setCur(0); toast.success("Loaded"); }
    catch { toast.error("Saved animation is damaged"); }
  };

  return (
    <div className="h-full flex flex-col bg-card text-xs">
      <div className="px-3 py-2 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2"><Film className="w-4 h-4 text-primary" />2D Anime Studio</h3>
        <div className="flex gap-1">
          <Button size="sm" variant="outline" className="h-6 px-2 text-[10px]" onClick={save}><Save className="w-3 h-3" /></Button>
          <Button size="sm" variant="outline" className="h-6 px-2 text-[10px]" onClick={load}><FolderOpen className="w-3 h-3" /></Button>
        </div>
      </div>

      <div className="p-2 border-b border-border">
        <div className="relative w-full rounded overflow-hidden border border-border" style={{ aspectRatio: `${W}/${H}`, background: bg }}>
          <canvas ref={onionRef} width={W} height={H} className="absolute inset-0 w-full h-full pointer-events-none" />
          <canvas ref={canvasRef} width={W} height={H}
            className="absolute inset-0 w-full h-full touch-none cursor-crosshair"
            onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up} />
        </div>
      </div>

      <div className="p-2 space-y-2 border-b border-border">
        <div className="grid grid-cols-3 gap-1">
          <Button size="sm" variant={tool === "brush" ? "default" : "outline"} className="h-7 text-[10px]" onClick={() => setTool("brush")}><Brush className="w-3 h-3 mr-1" />Brush</Button>
          <Button size="sm" variant={tool === "eraser" ? "default" : "outline"} className="h-7 text-[10px]" onClick={() => setTool("eraser")}><Eraser className="w-3 h-3 mr-1" />Eraser</Button>
          <Button size="sm" variant={tool === "fill" ? "default" : "outline"} className="h-7 text-[10px]" onClick={() => setTool("fill")}><PaintBucket className="w-3 h-3 mr-1" />Fill</Button>
        </div>
        <div className="flex flex-wrap gap-1 items-center">
          {PALETTE.map((c) => (
            <button key={c} onClick={() => setColor(c)} aria-label={`Color ${c}`}
              className={`w-5 h-5 rounded border ${color === c ? "ring-2 ring-primary" : "border-border"}`} style={{ background: c }} />
          ))}
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-6 h-6 bg-transparent" aria-label="Custom color" />
        </div>
        <div>
          <div className="flex justify-between"><span>Brush size</span><span className="text-muted-foreground">{size}</span></div>
          <Slider min={1} max={30} step={1} value={[size]} onValueChange={(v) => setSize(v[0])} />
        </div>
        <div className="flex items-center gap-2">
          <span>Background</span>
          <input type="color" value={bg} onChange={(e) => setBg(e.target.value)} className="w-6 h-6 bg-transparent" aria-label="Background color" />
          <label className="flex items-center gap-1 ml-auto"><input type="checkbox" checked={onion} onChange={(e) => setOnion(e.target.checked)} />Onion skin</label>
        </div>
      </div>

      <div className="p-2 space-y-2 flex-1 overflow-auto">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Frames · {cur + 1}/{frames.length}</span>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" className="h-6 px-2" onClick={() => addFrame(false)} title="New blank frame"><Plus className="w-3 h-3" /></Button>
            <Button size="sm" variant="outline" className="h-6 px-2" onClick={() => addFrame(true)} title="Copy this frame"><Copy className="w-3 h-3" /></Button>
            <Button size="sm" variant="outline" className="h-6 px-2" onClick={delFrame} title="Delete frame"><Trash2 className="w-3 h-3" /></Button>
          </div>
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1">
          {frames.map((f, i) => (
            <button key={i} onClick={() => { setPlaying(false); setCur(i); }}
              className={`shrink-0 w-16 rounded border ${i === cur ? "border-primary ring-1 ring-primary" : "border-border"}`} style={{ aspectRatio: `${W}/${H}`, background: bg }}>
              <img src={f} alt={`Frame ${i + 1}`} className="w-full h-full object-contain" />
            </button>
          ))}
        </div>
        <div>
          <div className="flex justify-between"><span>Speed</span><span className="text-muted-foreground">{fps} frames/sec</span></div>
          <Slider min={1} max={24} step={1} value={[fps]} onValueChange={(v) => setFps(v[0])} />
        </div>
        <div className="grid grid-cols-3 gap-1">
          <Button size="sm" className="h-7 text-[10px]" disabled={frames.length < 2} onClick={() => setPlaying(!playing)}>
            {playing ? <><Pause className="w-3 h-3 mr-1" />Stop</> : <><Play className="w-3 h-3 mr-1" />Play</>}
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-[10px]" disabled={frames.length < 2} onClick={exportVideo}><Download className="w-3 h-3 mr-1" />Video</Button>
          <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={exportPNG}><Download className="w-3 h-3 mr-1" />Image</Button>
        </div>
      </div>
    </div>
  );
};

export default Anime2DStudio;

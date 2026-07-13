// Character Studio — offline low-poly human / anime character builder.
// Uses three.js. Exports GLB. No network required.
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User, Download, Sparkles, Palette } from "lucide-react";
import { toast } from "sonner";

type Preset = "human" | "anime-girl" | "anime-boy" | "warrior" | "mage" | "robot";

interface Params {
  preset: Preset;
  height: number;      // 0.6 – 1.4 (multiplier)
  head: number;        // 0.7 – 1.6
  shoulders: number;   // 0.7 – 1.5
  waist: number;       // 0.6 – 1.3
  legs: number;        // 0.6 – 1.4
  skin: string;
  hair: string;
  outfit: string;
  accent: string;
  eyeStyle: "dot" | "anime" | "glow";
}

const DEFAULTS: Record<Preset, Partial<Params>> = {
  "human":       { height: 1.0, head: 1.0, shoulders: 1.1, waist: 1.0, legs: 1.0, skin: "#f2c9a4", hair: "#3b2314", outfit: "#3b82f6", accent: "#f59e0b", eyeStyle: "dot" },
  "anime-girl":  { height: 0.92, head: 1.35, shoulders: 0.85, waist: 0.75, legs: 1.05, skin: "#fde4d0", hair: "#f472b6", outfit: "#a78bfa", accent: "#fbcfe8", eyeStyle: "anime" },
  "anime-boy":   { height: 0.95, head: 1.3, shoulders: 1.0, waist: 0.85, legs: 1.05, skin: "#f5d0b5", hair: "#22d3ee", outfit: "#0ea5e9", accent: "#f97316", eyeStyle: "anime" },
  "warrior":     { height: 1.1, head: 0.95, shoulders: 1.45, waist: 1.1, legs: 1.1, skin: "#c99574", hair: "#111827", outfit: "#78350f", accent: "#eab308", eyeStyle: "dot" },
  "mage":        { height: 1.02, head: 1.05, shoulders: 0.9, waist: 0.95, legs: 1.0, skin: "#e8c9a0", hair: "#e5e7eb", outfit: "#4c1d95", accent: "#22d3ee", eyeStyle: "glow" },
  "robot":       { height: 1.05, head: 1.0, shoulders: 1.2, waist: 0.95, legs: 1.0, skin: "#94a3b8", hair: "#64748b", outfit: "#1f2937", accent: "#22d3ee", eyeStyle: "glow" },
};

const CharacterStudio = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const [params, setParams] = useState<Params>({
    preset: "anime-girl",
    height: 0.92, head: 1.35, shoulders: 0.85, waist: 0.75, legs: 1.05,
    skin: "#fde4d0", hair: "#f472b6", outfit: "#a78bfa", accent: "#fbcfe8",
    eyeStyle: "anime",
  });
  const [name, setName] = useState("character");

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e1a);
    sceneRef.current = scene;

    const cam = new THREE.PerspectiveCamera(45, mount.clientWidth / mount.clientHeight, 0.1, 100);
    cam.position.set(0, 2.2, 5);
    cameraRef.current = cam;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ctrl = new OrbitControls(cam, renderer.domElement);
    ctrl.target.set(0, 1.6, 0);
    ctrl.enableDamping = true;

    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const key = new THREE.DirectionalLight(0xffffff, 1.1); key.position.set(3, 5, 4); scene.add(key);
    const rim = new THREE.DirectionalLight(0xa855f7, 0.5); rim.position.set(-3, 2, -2); scene.add(rim);

    const floor = new THREE.Mesh(new THREE.CircleGeometry(3, 32), new THREE.MeshStandardMaterial({ color: 0x1a1f2e, roughness: 0.9 }));
    floor.rotation.x = -Math.PI / 2; scene.add(floor);
    const grid = new THREE.GridHelper(6, 12, 0x22d3ee, 0x1e293b);
    (grid.material as THREE.Material).transparent = true; (grid.material as THREE.Material).opacity = 0.25;
    scene.add(grid);

    let raf = 0;
    const tick = () => { ctrl.update(); renderer.render(scene, cam); raf = requestAnimationFrame(tick); };
    tick();

    const onResize = () => {
      cam.aspect = mount.clientWidth / mount.clientHeight;
      cam.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    const ro = new ResizeObserver(onResize); ro.observe(mount);

    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, []);

  // Rebuild model whenever params change
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    if (modelRef.current) scene.remove(modelRef.current);
    modelRef.current = buildCharacter(params);
    scene.add(modelRef.current);
  }, [params]);

  const applyPreset = (preset: Preset) => {
    setParams({ ...params, ...(DEFAULTS[preset] as Params), preset });
  };

  const exportGLB = () => {
    const model = modelRef.current;
    if (!model) return;
    const exp = new GLTFExporter();
    exp.parse(model, (result) => {
      const blob = result instanceof ArrayBuffer
        ? new Blob([result], { type: "model/gltf-binary" })
        : new Blob([JSON.stringify(result)], { type: "model/gltf+json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${name}.${result instanceof ArrayBuffer ? "glb" : "gltf"}`;
      a.click(); URL.revokeObjectURL(url);
      toast.success(`Exported ${a.download}`);
    }, (err) => toast.error("Export failed", { description: String(err) }), { binary: true });
  };

  const set = <K extends keyof Params>(k: K, v: Params[K]) => setParams((p) => ({ ...p, [k]: v }));

  return (
    <div className="h-full flex flex-col bg-card">
      <div className="px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2 mb-1">
          <User className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Character Studio</h3>
        </div>
        <p className="text-[10px] text-muted-foreground leading-tight">
          Offline · low-poly humans & anime · export GLB for games
        </p>
      </div>

      <div ref={mountRef} className="h-64 border-b border-border bg-[#0a0e1a]" />

      <div className="px-3 py-2 border-b border-border flex flex-wrap gap-1">
        {(Object.keys(DEFAULTS) as Preset[]).map((p) => (
          <Button key={p} size="sm" variant={params.preset === p ? "default" : "outline"}
            className="h-6 text-[10px] px-2" onClick={() => applyPreset(p)}>
            {p}
          </Button>
        ))}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3 text-xs">
          {([
            ["height", 0.6, 1.4],
            ["head", 0.7, 1.6],
            ["shoulders", 0.7, 1.5],
            ["waist", 0.6, 1.3],
            ["legs", 0.6, 1.4],
          ] as const).map(([k, min, max]) => (
            <div key={k}>
              <div className="flex justify-between mb-1">
                <span className="capitalize">{k}</span>
                <span className="text-muted-foreground">{params[k].toFixed(2)}</span>
              </div>
              <Slider min={min} max={max} step={0.01} value={[params[k] as number]}
                onValueChange={(v) => set(k, v[0] as any)} />
            </div>
          ))}

          <div className="pt-2 border-t border-border space-y-2">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
              <Palette className="w-3 h-3" /> Colors
            </div>
            {(["skin", "hair", "outfit", "accent"] as const).map((k) => (
              <div key={k} className="flex items-center gap-2">
                <span className="w-16 capitalize">{k}</span>
                <input type="color" value={params[k]} onChange={(e) => set(k, e.target.value)}
                  className="h-6 w-10 bg-transparent rounded cursor-pointer" />
                <span className="text-muted-foreground text-[10px]">{params[k]}</span>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <span className="w-16">Eyes</span>
              {(["dot", "anime", "glow"] as const).map((s) => (
                <Button key={s} size="sm" variant={params.eyeStyle === s ? "default" : "outline"}
                  className="h-6 text-[10px] px-2" onClick={() => set("eyeStyle", s)}>{s}</Button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-border space-y-2">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Export
            </div>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="h-7 text-xs" />
            <Button size="sm" className="w-full h-7 text-xs" onClick={exportGLB}>
              <Download className="w-3 h-3 mr-1" /> Export .glb
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

// ── Character mesh builder ─────────────────────────────────────────────
function buildCharacter(p: Params): THREE.Group {
  const g = new THREE.Group();
  const skin = new THREE.MeshStandardMaterial({ color: p.skin, roughness: 0.7 });
  const hair = new THREE.MeshStandardMaterial({ color: p.hair, roughness: 0.5 });
  const outfit = new THREE.MeshStandardMaterial({ color: p.outfit, roughness: 0.6 });
  const accent = new THREE.MeshStandardMaterial({ color: p.accent, roughness: 0.4, metalness: 0.3 });

  const H = 1.8 * p.height;              // total ~ height
  const headR = 0.22 * p.head;
  const bodyH = H * 0.42;
  const legH = H * 0.42;

  // legs
  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.12 * p.legs, 0.14 * p.legs, legH, 12), outfit);
    leg.position.set(side * 0.14, legH / 2, 0);
    g.add(leg);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.1, 0.35), accent);
    foot.position.set(side * 0.14, 0.05, 0.08); g.add(foot);
  }

  // torso — tapered box
  const torso = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28 * p.waist, 0.34 * p.shoulders, bodyH, 12),
    outfit
  );
  torso.position.y = legH + bodyH / 2;
  g.add(torso);

  // arms
  const armH = bodyH * 0.95;
  for (const side of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, armH, 10), outfit);
    arm.position.set(side * (0.34 * p.shoulders + 0.08), legH + bodyH - armH / 2, 0);
    arm.rotation.z = side * 0.05;
    g.add(arm);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), skin);
    hand.position.set(side * (0.34 * p.shoulders + 0.08), legH + bodyH - armH, 0);
    g.add(hand);
  }

  // neck + head
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.12, 10), skin);
  neck.position.y = legH + bodyH + 0.06; g.add(neck);
  const head = new THREE.Mesh(new THREE.SphereGeometry(headR, 24, 24), skin);
  head.position.y = legH + bodyH + 0.12 + headR;
  g.add(head);

  // hair — cap + optional side strands for anime presets
  const cap = new THREE.Mesh(new THREE.SphereGeometry(headR * 1.08, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.6), hair);
  cap.position.copy(head.position); g.add(cap);
  if (p.preset === "anime-girl" || p.preset === "anime-boy" || p.preset === "mage") {
    for (const side of [-1, 1]) {
      const strand = new THREE.Mesh(new THREE.ConeGeometry(headR * 0.35, headR * 2.4, 8), hair);
      strand.position.set(side * headR * 0.9, head.position.y - headR * 0.4, 0);
      strand.rotation.z = side * 0.35;
      g.add(strand);
    }
  }

  // eyes
  const eyeGeom = p.eyeStyle === "anime"
    ? new THREE.SphereGeometry(headR * 0.22, 16, 16)
    : new THREE.SphereGeometry(headR * 0.09, 12, 12);
  const eyeMat = p.eyeStyle === "glow"
    ? new THREE.MeshBasicMaterial({ color: p.accent })
    : new THREE.MeshStandardMaterial({ color: p.eyeStyle === "anime" ? p.accent : 0x111111 });
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(eyeGeom, eyeMat);
    eye.position.set(side * headR * 0.4, head.position.y + headR * 0.05, headR * 0.9);
    g.add(eye);
  }

  // Preset extras
  if (p.preset === "warrior") {
    const sword = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.9, 0.02), accent);
    sword.position.set(0.55, legH + bodyH * 0.6, 0.1); g.add(sword);
  }
  if (p.preset === "mage") {
    const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.4, 10), hair);
    staff.position.set(-0.55, legH + bodyH * 0.55, 0); g.add(staff);
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), new THREE.MeshBasicMaterial({ color: p.accent }));
    orb.position.set(-0.55, legH + bodyH * 1.15, 0); g.add(orb);
  }
  if (p.preset === "robot") {
    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.25, 8), accent);
    antenna.position.set(0, head.position.y + headR + 0.12, 0); g.add(antenna);
  }

  g.traverse((c) => { if ((c as THREE.Mesh).isMesh) (c as THREE.Mesh).castShadow = true; });
  return g;
}

export default CharacterStudio;

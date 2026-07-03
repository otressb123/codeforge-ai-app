import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Box, Circle, Square, Cylinder, Trees, Building2, Sparkles, Trash2, Download, Upload, Sun, User, Eye, Wand2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type SceneObject = {
  id: string;
  name: string;
  mesh: THREE.Object3D;
};

const Scene3DPanel = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const objectsRef = useRef<SceneObject[]>([]);
  const [, force] = useState(0);
  const rerender = () => force((n) => n + 1);
  const [prompt, setPrompt] = useState("modern downtown with 5x5 blocks and a park");
  const [aiPrompt, setAiPrompt] = useState("futuristic neon city with skyscrapers, cars on roads and a central lake");
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // ── Init three.js ──────────────────────────────────────────────────────
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e1a);
    scene.fog = new THREE.Fog(0x0a0e1a, 30, 120);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(60, mount.clientWidth / mount.clientHeight, 0.1, 500);
    camera.position.set(20, 18, 25);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.shadowMap.enabled = true;
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controlsRef.current = controls;

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(0x88ddff, 1.2);
    sun.position.set(30, 40, 20);
    sun.castShadow = true;
    scene.add(sun);
    const rim = new THREE.DirectionalLight(0xff66cc, 0.5);
    rim.position.set(-20, 15, -10);
    scene.add(rim);

    // Ground
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      new THREE.MeshStandardMaterial({ color: 0x1a1f2e, roughness: 0.9 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Grid
    const grid = new THREE.GridHelper(200, 40, 0x22d3ee, 0x1e293b);
    (grid.material as THREE.Material).opacity = 0.3;
    (grid.material as THREE.Material).transparent = true;
    scene.add(grid);

    let raf = 0;
    const tick = () => {
      controls.update();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    const onResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(mount);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  const addObject = useCallback((mesh: THREE.Object3D, name: string) => {
    const scene = sceneRef.current;
    if (!scene) return;
    scene.add(mesh);
    const obj: SceneObject = { id: crypto.randomUUID(), name, mesh };
    objectsRef.current.push(obj);
    setSelectedId(obj.id);
    rerender();
  }, []);

  const randColor = () => {
    const palette = [0x22d3ee, 0xa855f7, 0xec4899, 0xf59e0b, 0x10b981, 0x6366f1, 0xef4444];
    return palette[Math.floor(Math.random() * palette.length)];
  };

  const addPrimitive = (kind: "box" | "sphere" | "cylinder" | "plane" | "tree" | "human") => {
    let mesh: THREE.Object3D;
    const mat = new THREE.MeshStandardMaterial({ color: randColor(), roughness: 0.5, metalness: 0.2 });
    if (kind === "box") mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), mat);
    else if (kind === "sphere") mesh = new THREE.Mesh(new THREE.SphereGeometry(1.2, 32, 32), mat);
    else if (kind === "cylinder") mesh = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 2.5, 32), mat);
    else if (kind === "plane") mesh = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), mat);
    else if (kind === "tree") {
      const g = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 1.2, 8), new THREE.MeshStandardMaterial({ color: 0x6b3a1a }));
      trunk.position.y = 0.6;
      const leaves = new THREE.Mesh(new THREE.ConeGeometry(0.9, 2, 8), new THREE.MeshStandardMaterial({ color: 0x10b981 }));
      leaves.position.y = 2;
      g.add(trunk); g.add(leaves);
      mesh = g;
    } else {
      // simple stylized human (capsule body + sphere head)
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.4, 1.2, 8, 16), new THREE.MeshStandardMaterial({ color: randColor() }));
      body.position.y = 1;
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.35, 24, 24), new THREE.MeshStandardMaterial({ color: 0xfde68a }));
      head.position.y = 2.1;
      g.add(body); g.add(head);
      mesh = g;
    }
    mesh.position.y = kind === "plane" ? 0.01 : 1;
    mesh.traverse((c) => { if ((c as THREE.Mesh).isMesh) { (c as THREE.Mesh).castShadow = true; } });
    addObject(mesh, kind);
  };

  // ── Procedural city generator ─────────────────────────────────────────
  const generateFromPrompt = () => {
    const scene = sceneRef.current;
    if (!scene) return;
    const lower = prompt.toLowerCase();

    // parse "NxM"
    const sizeMatch = lower.match(/(\d+)\s*x\s*(\d+)/);
    const w = sizeMatch ? Math.min(15, parseInt(sizeMatch[1])) : 6;
    const h = sizeMatch ? Math.min(15, parseInt(sizeMatch[2])) : 6;

    const wantsPark = /park|forest|tree/.test(lower);
    const wantsPeople = /people|human|crowd|npc/.test(lower);
    const isModern = /modern|downtown|sky|tower/.test(lower);
    const isAnime = /anime|cute|pastel|low.?poly/.test(lower);

    const group = new THREE.Group();
    const spacing = 3.5;
    const offsetX = -(w * spacing) / 2;
    const offsetZ = -(h * spacing) / 2;

    for (let i = 0; i < w; i++) {
      for (let j = 0; j < h; j++) {
        const centerDist = Math.hypot(i - w / 2, j - h / 2);
        const baseH = isModern ? (8 - centerDist * 0.8) : 3;
        const height = Math.max(1.2, baseH + Math.random() * 4);
        const color = isAnime
          ? new THREE.Color().setHSL(Math.random(), 0.6, 0.7).getHex()
          : (Math.random() > 0.5 ? 0x334155 : 0x475569);
        const mesh = new THREE.Mesh(
          new THREE.BoxGeometry(2.2, height, 2.2),
          new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.3 })
        );
        mesh.position.set(offsetX + i * spacing, height / 2, offsetZ + j * spacing);
        mesh.castShadow = true;
        group.add(mesh);

        // windows hint (emissive small box on top)
        if (isModern && height > 4) {
          const glow = new THREE.Mesh(
            new THREE.BoxGeometry(1.8, height * 0.6, 1.8),
            new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.15 })
          );
          glow.position.copy(mesh.position);
          group.add(glow);
        }
      }
    }

    // park in center
    if (wantsPark) {
      const trees = 12;
      for (let t = 0; t < trees; t++) {
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 1, 8), new THREE.MeshStandardMaterial({ color: 0x6b3a1a }));
        const leaves = new THREE.Mesh(new THREE.ConeGeometry(0.8, 1.8, 8), new THREE.MeshStandardMaterial({ color: 0x10b981 }));
        const g = new THREE.Group();
        trunk.position.y = 0.5; leaves.position.y = 1.7;
        g.add(trunk); g.add(leaves);
        g.position.set((Math.random() - 0.5) * 8, 0, (Math.random() - 0.5) * 8);
        group.add(g);
      }
    }

    if (wantsPeople) {
      for (let p = 0; p < 8; p++) {
        const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 0.9, 6, 12), new THREE.MeshStandardMaterial({ color: 0xec4899 }));
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 16), new THREE.MeshStandardMaterial({ color: 0xfde68a }));
        const g = new THREE.Group();
        body.position.y = 0.75; head.position.y = 1.6;
        g.add(body); g.add(head);
        g.position.set((Math.random() - 0.5) * w * spacing * 0.8, 0, (Math.random() - 0.5) * h * spacing * 0.8);
        group.add(g);
      }
    }

    addObject(group, `city: "${prompt.slice(0, 24)}…"`);
    toast.success(`Generated scene (${group.children.length} objects)`);
  };

  // ── AI Scene Generator (Lovable AI structured output) ─────────────────
  const generateFromAI = async () => {
    if (!aiPrompt.trim() || aiLoading) return;
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("scene-ai", {
        body: { prompt: aiPrompt.trim() },
      });
      if (error) {
        const msg = (error as any).message ?? "";
        if (/402|credit/i.test(msg)) toast.error("AI credits exhausted", { description: "Add credits or use offline procedural generator" });
        else if (/429/.test(msg)) toast.error("Rate limited");
        else toast.error(msg || "AI scene failed");
        return;
      }
      const scene: { name?: string; objects?: any[] } = data?.scene ?? {};
      const objs = Array.isArray(scene.objects) ? scene.objects : [];
      if (objs.length === 0) { toast.error("AI returned no objects"); return; }

      const group = new THREE.Group();
      const parseColor = (c?: string) => {
        try { return new THREE.Color(c ?? "#64748b").getHex(); } catch { return 0x64748b; }
      };

      for (const o of objs) {
        const color = parseColor(o.color);
        const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.2 });
        let mesh: THREE.Object3D | null = null;
        const sx = Number(o.sx ?? 1), sy = Number(o.sy ?? 1), sz = Number(o.sz ?? 1);

        switch (o.kind) {
          case "box": mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat); break;
          case "sphere": mesh = new THREE.Mesh(new THREE.SphereGeometry(Math.max(0.2, sx / 2), 24, 24), mat); break;
          case "cylinder": mesh = new THREE.Mesh(new THREE.CylinderGeometry(sx / 2, sx / 2, sy, 24), mat); break;
          case "cone": mesh = new THREE.Mesh(new THREE.ConeGeometry(sx / 2, sy, 16), mat); break;
          case "road": mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, 0.05, sz), new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.95 })); break;
          case "water": mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, 0.1, sz), new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.2, metalness: 0.6, transparent: true, opacity: 0.75 })); break;
          case "car": {
            const g = new THREE.Group();
            const body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 3), mat);
            body.position.y = 0.35;
            const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.5, 1.6), new THREE.MeshStandardMaterial({ color: 0x0ea5e9, transparent: true, opacity: 0.6 }));
            cabin.position.y = 0.85;
            g.add(body, cabin);
            mesh = g; break;
          }
          case "tree": {
            const g = new THREE.Group();
            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 1.2, 8), new THREE.MeshStandardMaterial({ color: 0x6b3a1a }));
            trunk.position.y = 0.6;
            const leaves = new THREE.Mesh(new THREE.ConeGeometry(0.9, 2, 8), new THREE.MeshStandardMaterial({ color: 0x10b981 }));
            leaves.position.y = 2;
            g.add(trunk, leaves); mesh = g; break;
          }
          case "human": {
            const g = new THREE.Group();
            const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 1.1, 8, 16), mat);
            body.position.y = 0.9;
            const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 24, 24), new THREE.MeshStandardMaterial({ color: 0xfde68a }));
            head.position.y = 1.9;
            g.add(body, head); mesh = g; break;
          }
        }

        if (!mesh) continue;
        mesh.position.set(Number(o.x ?? 0), Number(o.y ?? 0), Number(o.z ?? 0));
        mesh.traverse((c) => { if ((c as THREE.Mesh).isMesh) (c as THREE.Mesh).castShadow = true; });
        group.add(mesh);
      }

      addObject(group, `ai: "${(scene.name || aiPrompt).slice(0, 26)}"`);
      toast.success(`AI built ${group.children.length} objects`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI scene failed");
    } finally {
      setAiLoading(false);
    }
  };

  // ── Import / Export ───────────────────────────────────────────────────
  const handleImportGLTF = (file: File) => {
    const url = URL.createObjectURL(file);
    const loader = new GLTFLoader();
    loader.load(url, (gltf) => {
      gltf.scene.traverse((c) => { if ((c as THREE.Mesh).isMesh) { (c as THREE.Mesh).castShadow = true; } });
      addObject(gltf.scene, file.name);
      toast.success(`Loaded ${file.name}`);
      URL.revokeObjectURL(url);
    }, undefined, (err) => {
      toast.error(`Failed to load model`, { description: String(err) });
    });
  };

  const exportScene = () => {
    const scene = sceneRef.current;
    if (!scene) return;
    const exporter = new GLTFExporter();
    exporter.parse(scene, (result) => {
      const blob = new Blob([JSON.stringify(result)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "scene.gltf";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Scene exported as scene.gltf");
    }, (err) => toast.error("Export failed", { description: String(err) }), { binary: false });
  };

  const deleteObject = (id: string) => {
    const obj = objectsRef.current.find((o) => o.id === id);
    if (!obj || !sceneRef.current) return;
    sceneRef.current.remove(obj.mesh);
    objectsRef.current = objectsRef.current.filter((o) => o.id !== id);
    if (selectedId === id) setSelectedId(null);
    rerender();
  };

  const clearAll = () => {
    const scene = sceneRef.current;
    if (!scene) return;
    objectsRef.current.forEach((o) => scene.remove(o.mesh));
    objectsRef.current = [];
    setSelectedId(null);
    rerender();
  };

  const frameSelected = () => {
    const obj = objectsRef.current.find((o) => o.id === selectedId);
    const cam = cameraRef.current;
    const ctrl = controlsRef.current;
    if (!obj || !cam || !ctrl) return;
    const box = new THREE.Box3().setFromObject(obj.mesh);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3()).length();
    ctrl.target.copy(center);
    cam.position.copy(center).add(new THREE.Vector3(size, size * 0.7, size));
    ctrl.update();
  };

  return (
    <div className="h-full flex flex-col bg-card">
      <div className="px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2 mb-2">
          <Building2 className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">3D Scene Builder</h3>
        </div>
        <p className="text-[10px] text-muted-foreground leading-tight">
          Three.js workspace · primitives · GLTF import · AI city/character generator
        </p>
      </div>

      {/* Viewport */}
      <div ref={mountRef} className="relative h-64 border-b border-border bg-[#0a0e1a]" />

      {/* AI prompt */}
      <div className="px-3 py-2 border-b border-border bg-secondary/30">
        <label className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1 mb-1">
          <Sparkles className="w-3 h-3" /> Generate from prompt (offline procedural)
        </label>
        <div className="flex gap-1">
          <Input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. anime 8x8 town with park and people"
            className="h-7 text-xs"
            onKeyDown={(e) => e.key === "Enter" && generateFromPrompt()}
          />
          <Button size="sm" className="h-7 px-2" onClick={generateFromPrompt}>
            <Sparkles className="w-3 h-3" />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">
          Tip: include "modern", "anime", "park", "people", and a size like "6x6".
        </p>
      </div>

      {/* Toolbar */}
      <div className="px-3 py-2 border-b border-border">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Add primitive</div>
        <div className="grid grid-cols-6 gap-1">
          <Button variant="ghost" size="sm" className="h-8 px-0" onClick={() => addPrimitive("box")}><Box className="w-4 h-4" /></Button>
          <Button variant="ghost" size="sm" className="h-8 px-0" onClick={() => addPrimitive("sphere")}><Circle className="w-4 h-4" /></Button>
          <Button variant="ghost" size="sm" className="h-8 px-0" onClick={() => addPrimitive("cylinder")}><Cylinder className="w-4 h-4" /></Button>
          <Button variant="ghost" size="sm" className="h-8 px-0" onClick={() => addPrimitive("plane")}><Square className="w-4 h-4" /></Button>
          <Button variant="ghost" size="sm" className="h-8 px-0" onClick={() => addPrimitive("tree")}><Trees className="w-4 h-4" /></Button>
          <Button variant="ghost" size="sm" className="h-8 px-0" onClick={() => addPrimitive("human")}><User className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* Import / Export */}
      <div className="px-3 py-2 border-b border-border flex gap-1">
        <label className="flex-1">
          <input
            type="file"
            accept=".glb,.gltf"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleImportGLTF(e.target.files[0])}
          />
          <Button asChild size="sm" variant="outline" className="w-full h-7 text-xs">
            <span><Upload className="w-3 h-3 mr-1" /> Import GLTF</span>
          </Button>
        </label>
        <Button size="sm" variant="outline" className="flex-1 h-7 text-xs" onClick={exportScene}>
          <Download className="w-3 h-3 mr-1" /> Export
        </Button>
      </div>

      {/* Object list */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border">
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
          Scene ({objectsRef.current.length})
        </span>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" className="h-6 px-1.5" onClick={frameSelected} disabled={!selectedId}>
            <Eye className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="ghost" className="h-6 px-1.5 text-destructive" onClick={clearAll}>
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-1.5 space-y-0.5">
          {objectsRef.current.length === 0 && (
            <div className="text-center text-xs text-muted-foreground py-8 px-4">
              <Sun className="w-6 h-6 mx-auto mb-2 opacity-50" />
              Empty scene. Add primitives or generate from a prompt.
            </div>
          )}
          {objectsRef.current.map((obj) => (
            <div
              key={obj.id}
              onClick={() => setSelectedId(obj.id)}
              className={`flex items-center justify-between px-2 py-1 rounded text-xs cursor-pointer ${
                selectedId === obj.id ? "bg-primary/15 text-primary" : "hover:bg-secondary/50"
              }`}
            >
              <span className="truncate flex-1">{obj.name}</span>
              <button
                onClick={(e) => { e.stopPropagation(); deleteObject(obj.id); }}
                className="opacity-0 group-hover:opacity-100 hover:text-destructive"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default Scene3DPanel;

// City Builder — offline grid-based city editor (Prisma3D-style).
// Click cells to place buildings, roads, trees, water. Export GLB.
import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Building2, Trees, Waves, Car, Route, Trash2, Download, Wand2, Eraser } from "lucide-react";
import { toast } from "sonner";

type Tool = "building" | "road" | "tree" | "water" | "car" | "erase";

interface Cell {
  tool: Tool;
  height: number;
  color: string;
}

const GRID = 24;      // 24×24 cells
const CELL = 1.2;     // world units per cell

const TOOL_META: Record<Tool, { icon: any; label: string; color: string; hint: string }> = {
  building: { icon: Building2, label: "Building", color: "#64748b", hint: "click to place, drag to paint" },
  road:     { icon: Route,     label: "Road",     color: "#1f2937", hint: "auto-connects into streets" },
  tree:     { icon: Trees,     label: "Tree",     color: "#10b981", hint: "" },
  water:    { icon: Waves,     label: "Water",    color: "#3b82f6", hint: "" },
  car:      { icon: Car,       label: "Car",      color: "#ef4444", hint: "" },
  erase:    { icon: Eraser,    label: "Erase",    color: "#ef4444", hint: "" },
};

const CityBuilder = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const groupRef = useRef<THREE.Group | null>(null);
  const gridRef = useRef<Map<string, Cell>>(new Map());
  const paintingRef = useRef(false);

  const [tool, setTool] = useState<Tool>("building");
  const [height, setHeight] = useState(3);
  const [color, setColor] = useState("#64748b");
  const [count, setCount] = useState(0);

  const key = (x: number, z: number) => `${x},${z}`;

  const rebuild = useCallback(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    if (groupRef.current) scene.remove(groupRef.current);
    const g = new THREE.Group();
    for (const [k, cell] of gridRef.current.entries()) {
      const [x, z] = k.split(",").map(Number);
      const wx = (x - GRID / 2) * CELL + CELL / 2;
      const wz = (z - GRID / 2) * CELL + CELL / 2;
      const mat = new THREE.MeshStandardMaterial({ color: cell.color, roughness: 0.7, metalness: 0.1 });
      let mesh: THREE.Object3D | null = null;
      switch (cell.tool) {
        case "building": {
          const h = cell.height;
          mesh = new THREE.Mesh(new THREE.BoxGeometry(CELL * 0.85, h, CELL * 0.85), mat);
          mesh.position.set(wx, h / 2, wz);
          // window glow
          if (h > 2) {
            const glow = new THREE.Mesh(
              new THREE.BoxGeometry(CELL * 0.7, h * 0.7, CELL * 0.7),
              new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.12 })
            );
            glow.position.copy(mesh.position);
            g.add(glow);
          }
          break;
        }
        case "road": {
          mesh = new THREE.Mesh(new THREE.BoxGeometry(CELL, 0.04, CELL), new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.95 }));
          mesh.position.set(wx, 0.02, wz);
          // lane stripe
          const stripe = new THREE.Mesh(new THREE.BoxGeometry(CELL * 0.9, 0.05, 0.06), new THREE.MeshBasicMaterial({ color: 0xfbbf24 }));
          stripe.position.set(wx, 0.05, wz); g.add(stripe);
          break;
        }
        case "tree": {
          const grp = new THREE.Group();
          const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.5, 8), new THREE.MeshStandardMaterial({ color: 0x6b3a1a }));
          trunk.position.y = 0.25;
          const leaves = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.9, 8), new THREE.MeshStandardMaterial({ color: cell.color }));
          leaves.position.y = 0.9;
          grp.add(trunk, leaves); grp.position.set(wx, 0, wz);
          mesh = grp; break;
        }
        case "water": {
          mesh = new THREE.Mesh(
            new THREE.BoxGeometry(CELL, 0.08, CELL),
            new THREE.MeshStandardMaterial({ color: cell.color, roughness: 0.2, metalness: 0.6, transparent: true, opacity: 0.8 })
          );
          mesh.position.set(wx, 0.04, wz); break;
        }
        case "car": {
          const grp = new THREE.Group();
          const body = new THREE.Mesh(new THREE.BoxGeometry(CELL * 0.4, 0.2, CELL * 0.7), mat);
          body.position.y = 0.15;
          const cabin = new THREE.Mesh(new THREE.BoxGeometry(CELL * 0.35, 0.18, CELL * 0.4), new THREE.MeshStandardMaterial({ color: 0x0ea5e9, transparent: true, opacity: 0.6 }));
          cabin.position.y = 0.32;
          grp.add(body, cabin); grp.position.set(wx, 0, wz);
          mesh = grp; break;
        }
      }
      if (mesh) {
        mesh.traverse((c) => { if ((c as THREE.Mesh).isMesh) (c as THREE.Mesh).castShadow = true; });
        g.add(mesh);
      }
    }
    scene.add(g);
    groupRef.current = g;
    setCount(gridRef.current.size);
  }, []);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e1a);
    scene.fog = new THREE.Fog(0x0a0e1a, 30, 90);
    sceneRef.current = scene;

    const cam = new THREE.PerspectiveCamera(50, mount.clientWidth / mount.clientHeight, 0.1, 300);
    cam.position.set(18, 20, 22);
    cameraRef.current = cam;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ctrl = new OrbitControls(cam, renderer.domElement);
    ctrl.enableDamping = true;
    ctrl.target.set(0, 0, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const sun = new THREE.DirectionalLight(0xffffff, 1); sun.position.set(20, 30, 15); scene.add(sun);
    scene.add(new THREE.DirectionalLight(0xa855f7, 0.35));

    // Ground plane (raycast target)
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(GRID * CELL, GRID * CELL),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.95 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.name = "__ground__";
    scene.add(ground);

    const grid = new THREE.GridHelper(GRID * CELL, GRID, 0x22d3ee, 0x1e293b);
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.35;
    scene.add(grid);

    // Raycast painting
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const paint = (ev: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, cam);
      const hit = raycaster.intersectObject(ground)[0];
      if (!hit) return;
      const cx = Math.floor(hit.point.x / CELL + GRID / 2);
      const cz = Math.floor(hit.point.z / CELL + GRID / 2);
      if (cx < 0 || cx >= GRID || cz < 0 || cz >= GRID) return;
      const k = key(cx, cz);
      // Read latest tool via ref-like closure trick — use dataset on canvas
      const t = (renderer.domElement.dataset.tool || "building") as Tool;
      const h = parseFloat(renderer.domElement.dataset.height || "3");
      const c = renderer.domElement.dataset.color || "#64748b";
      if (t === "erase") gridRef.current.delete(k);
      else gridRef.current.set(k, { tool: t, height: h, color: c });
      rebuild();
    };
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      paintingRef.current = true; paint(e);
    };
    const onMove = (e: PointerEvent) => { if (paintingRef.current) paint(e); };
    const onUp = () => { paintingRef.current = false; };
    renderer.domElement.addEventListener("pointerdown", onDown);
    renderer.domElement.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

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
      renderer.domElement.removeEventListener("pointerdown", onDown);
      renderer.domElement.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, [rebuild]);

  // Sync current tool onto canvas dataset so pointer handler sees latest
  useEffect(() => {
    const r = rendererRef.current;
    if (!r) return;
    r.domElement.dataset.tool = tool;
    r.domElement.dataset.height = String(height);
    r.domElement.dataset.color = tool === "tree" ? "#10b981" : tool === "water" ? "#3b82f6" : color;
  }, [tool, height, color]);

  // ── Procedural city generator (offline) ─────────────────────────
  const generate = (style: "grid" | "downtown" | "suburb" | "island") => {
    gridRef.current.clear();
    if (style === "grid" || style === "downtown") {
      // roads every 4 cells
      for (let i = 0; i < GRID; i++) for (let j = 0; j < GRID; j++) {
        if (i % 4 === 0 || j % 4 === 0) gridRef.current.set(key(i, j), { tool: "road", height: 0, color: "#1f2937" });
      }
      // buildings in blocks
      for (let i = 0; i < GRID; i++) for (let j = 0; j < GRID; j++) {
        if (i % 4 === 0 || j % 4 === 0) continue;
        if (Math.random() > 0.25) {
          const distFromCenter = Math.hypot(i - GRID / 2, j - GRID / 2);
          const h = style === "downtown"
            ? Math.max(2, 10 - distFromCenter * 0.6 + Math.random() * 5)
            : 2 + Math.random() * 3;
          const palette = ["#334155", "#475569", "#64748b", "#1e293b", "#0f172a"];
          gridRef.current.set(key(i, j), { tool: "building", height: h, color: palette[Math.floor(Math.random() * palette.length)] });
        }
      }
      // random cars on roads
      for (let n = 0; n < 12; n++) {
        const i = Math.floor(Math.random() * GRID); const j = Math.floor(Math.random() * GRID);
        if (gridRef.current.get(key(i, j))?.tool === "road") {
          gridRef.current.set(key(i, j), { tool: "car", height: 0, color: ["#ef4444", "#22d3ee", "#a855f7", "#f59e0b"][Math.floor(Math.random() * 4)] });
        }
      }
    } else if (style === "suburb") {
      for (let i = 2; i < GRID; i += 6) for (let j = 0; j < GRID; j++) gridRef.current.set(key(i, j), { tool: "road", height: 0, color: "#1f2937" });
      for (let i = 0; i < GRID; i++) for (let j = 0; j < GRID; j++) {
        if (i % 6 === 2) continue;
        if (Math.random() > 0.5) gridRef.current.set(key(i, j), { tool: Math.random() > 0.6 ? "tree" : "building", height: 1.5 + Math.random() * 1.5, color: Math.random() > 0.5 ? "#78350f" : "#10b981" });
      }
    } else if (style === "island") {
      const cx = GRID / 2, cz = GRID / 2;
      for (let i = 0; i < GRID; i++) for (let j = 0; j < GRID; j++) {
        const d = Math.hypot(i - cx, j - cz);
        if (d > 8) gridRef.current.set(key(i, j), { tool: "water", height: 0, color: "#3b82f6" });
        else if (d < 6 && Math.random() > 0.5) gridRef.current.set(key(i, j), { tool: "building", height: 2 + Math.random() * 4, color: "#64748b" });
        else if (d < 8 && Math.random() > 0.6) gridRef.current.set(key(i, j), { tool: "tree", height: 0, color: "#10b981" });
      }
    }
    rebuild();
    toast.success(`Generated ${style} · ${gridRef.current.size} tiles`);
  };

  const clear = () => { gridRef.current.clear(); rebuild(); };

  const exportGLB = () => {
    const g = groupRef.current;
    if (!g) return;
    const exp = new GLTFExporter();
    exp.parse(g, (result) => {
      const blob = result instanceof ArrayBuffer
        ? new Blob([result], { type: "model/gltf-binary" })
        : new Blob([JSON.stringify(result)], { type: "model/gltf+json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `city.${result instanceof ArrayBuffer ? "glb" : "gltf"}`;
      a.click(); URL.revokeObjectURL(url);
      toast.success(`Exported ${a.download}`);
    }, (err) => toast.error("Export failed", { description: String(err) }), { binary: true });
  };

  return (
    <div className="h-full flex flex-col bg-card">
      <div className="px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2 mb-1">
          <Building2 className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">City Builder</h3>
        </div>
        <p className="text-[10px] text-muted-foreground leading-tight">
          Offline grid editor · click/drag to paint · Prisma3D-style
        </p>
      </div>

      <div ref={mountRef} className="h-72 border-b border-border bg-[#0a0e1a]" />

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3 text-xs">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Tool</div>
            <div className="grid grid-cols-3 gap-1">
              {(Object.keys(TOOL_META) as Tool[]).map((t) => {
                const Icon = TOOL_META[t].icon;
                return (
                  <Button key={t} size="sm" variant={tool === t ? "default" : "outline"}
                    className="h-8 text-[10px] flex-col gap-0.5 px-1" onClick={() => setTool(t)}>
                    <Icon className="w-3.5 h-3.5" />
                    <span>{TOOL_META[t].label}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {tool === "building" && (
            <div>
              <div className="flex justify-between mb-1">
                <span>Height</span>
                <span className="text-muted-foreground">{height.toFixed(1)}</span>
              </div>
              <Slider min={1} max={12} step={0.5} value={[height]} onValueChange={(v) => setHeight(v[0])} />
              <div className="flex items-center gap-2 mt-2">
                <span className="w-14">Color</span>
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
                  className="h-6 w-10 bg-transparent rounded cursor-pointer" />
                <span className="text-[10px] text-muted-foreground">{color}</span>
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-border">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1 flex items-center gap-1">
              <Wand2 className="w-3 h-3" /> Procedural
            </div>
            <div className="grid grid-cols-2 gap-1">
              {(["grid", "downtown", "suburb", "island"] as const).map((s) => (
                <Button key={s} size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => generate(s)}>
                  {s}
                </Button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-border flex gap-1">
            <Button size="sm" variant="outline" className="flex-1 h-7 text-[10px]" onClick={clear}>
              <Trash2 className="w-3 h-3 mr-1" /> Clear
            </Button>
            <Button size="sm" className="flex-1 h-7 text-[10px]" onClick={exportGLB}>
              <Download className="w-3 h-3 mr-1" /> Export .glb
            </Button>
          </div>

          <div className="text-[10px] text-muted-foreground pt-1 border-t border-border">
            {count} tiles · left-click to paint, drag to fill, orbit with right-click
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default CityBuilder;

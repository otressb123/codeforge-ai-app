// Digital clay sculpting — push, pull, smooth, flatten, pinch with X-symmetry. Offline.
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Hand, Download, Save, FolderOpen, RotateCcw, Undo2, Send } from "lucide-react";
import { toast } from "sonner";
import { sendSculpt } from "@/lib/meshTransfer";

type Brush = "pull" | "push" | "smooth" | "flatten" | "pinch";
type Base = "sphere" | "head" | "box" | "cylinder";
const STORE = "codeforge.sculpt.v1";

const makeBase = (b: Base) => {
  let g: THREE.BufferGeometry;
  if (b === "box") g = new THREE.BoxGeometry(1.4, 1.4, 1.4, 48, 48, 48);
  else if (b === "cylinder") g = new THREE.CylinderGeometry(0.7, 0.7, 1.8, 96, 64);
  else g = new THREE.SphereGeometry(1, 128, 96);
  g.deleteAttribute("uv"); g.deleteAttribute("normal");
  g = mergeVertices(g);
  if (b === "head") {
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i);
      p.setXYZ(i, p.getX(i) * (y < 0 ? 0.82 + 0.1 * (y + 1) : 0.92), y * 1.15, p.getZ(i) * 0.95);
    }
  }
  g.computeVertexNormals();
  return g;
};

const buildNeighbors = (g: THREE.BufferGeometry) => {
  const idx = g.index!.array; const n: Set<number>[] = Array.from({ length: g.attributes.position.count }, () => new Set());
  for (let i = 0; i < idx.length; i += 3) {
    const a = idx[i], b = idx[i + 1], c = idx[i + 2];
    n[a].add(b).add(c); n[b].add(a).add(c); n[c].add(a).add(b);
  }
  return n.map((s) => [...s]);
};

const SculptStudio = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const neighRef = useRef<number[][]>([]);
  const undoRef = useRef<Float32Array[]>([]);
  const ctrlRef = useRef<OrbitControls | null>(null);
  const [brush, setBrush] = useState<Brush>("pull");
  const [radius, setRadius] = useState(0.25);
  const [strength, setStrength] = useState(0.5);
  const [symmetry, setSymmetry] = useState(true);
  const [color, setColor] = useState("#e8c4a8");
  const [base, setBase] = useState<Base>("head");
  const [wire, setWire] = useState(false);
  const opts = useRef({ brush, radius, strength, symmetry });
  opts.current = { brush, radius, strength, symmetry };

  const setGeometry = (g: THREE.BufferGeometry) => {
    const m = meshRef.current!; m.geometry.dispose(); m.geometry = g;
    neighRef.current = buildNeighbors(g); undoRef.current = [];
  };

  useEffect(() => {
    const mount = mountRef.current!;
    const scene = new THREE.Scene(); scene.background = new THREE.Color(0x1a1d26);
    const cam = new THREE.PerspectiveCamera(40, mount.clientWidth / mount.clientHeight, 0.1, 100); cam.position.set(0, 0.3, 4.2);
    const r = new THREE.WebGLRenderer({ antialias: true }); r.setPixelRatio(Math.min(2, devicePixelRatio));
    r.setSize(mount.clientWidth, mount.clientHeight); mount.appendChild(r.domElement);
    const ctrl = new OrbitControls(cam, r.domElement); ctrl.enableDamping = true;
    ctrl.mouseButtons = { LEFT: null as any, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE };
    ctrlRef.current = ctrl;
    scene.add(new THREE.HemisphereLight(0xffffff, 0x404858, 0.9));
    const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(3, 4, 5); scene.add(key);
    const rim = new THREE.DirectionalLight(0x9db4ff, 0.6); rim.position.set(-4, 2, -3); scene.add(rim);

    const mesh = new THREE.Mesh(makeBase("head"), new THREE.MeshStandardMaterial({ color: 0xe8c4a8, roughness: 0.55 }));
    scene.add(mesh); meshRef.current = mesh; neighRef.current = buildNeighbors(mesh.geometry);

    const cursor = new THREE.Mesh(new THREE.RingGeometry(0.97, 1, 48), new THREE.MeshBasicMaterial({ color: 0x22d3ee, side: THREE.DoubleSide, depthTest: false }));
    cursor.renderOrder = 10; cursor.visible = false; scene.add(cursor);

    const ray = new THREE.Raycaster(); const mouse = new THREE.Vector2();
    let down = false;
    const hitAt = (e: PointerEvent) => {
      const rect = r.domElement.getBoundingClientRect();
      mouse.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
      ray.setFromCamera(mouse, cam);
      return ray.intersectObject(mesh)[0];
    };

    const sculptAt = (point: THREE.Vector3, normal: THREE.Vector3) => {
      const { brush, radius, strength } = opts.current;
      const pos = mesh.geometry.attributes.position as THREE.BufferAttribute;
      const nrm = mesh.geometry.attributes.normal as THREE.BufferAttribute;
      const v = new THREE.Vector3(); const R2 = radius * radius;
      const s = strength * 0.02;
      const touched: number[] = [];
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i);
        const d2 = v.distanceToSquared(point); if (d2 > R2) continue;
        const f = Math.pow(1 - Math.sqrt(d2) / radius, 2) * (3 - 2 * (1 - Math.sqrt(d2) / radius)) / 1;
        touched.push(i);
        if (brush === "pull" || brush === "push") {
          const dir = brush === "pull" ? 1 : -1;
          v.addScaledVector(normal, dir * s * f * 2.5);
        } else if (brush === "flatten") {
          const dist = v.clone().sub(point).dot(normal);
          v.addScaledVector(normal, -dist * f * strength * 0.5);
        } else if (brush === "pinch") {
          v.lerp(point, f * strength * 0.08);
        } else if (brush === "smooth") {
          const nb = neighRef.current[i]; if (!nb.length) continue;
          const avg = new THREE.Vector3();
          for (const j of nb) avg.add(new THREE.Vector3().fromBufferAttribute(pos, j));
          avg.divideScalar(nb.length);
          v.lerp(avg, f * strength * 0.9);
        }
        pos.setXYZ(i, v.x, v.y, v.z);
      }
      if (touched.length) { pos.needsUpdate = true; mesh.geometry.computeVertexNormals(); nrm.needsUpdate = true; }
    };

    const stroke = (e: PointerEvent) => {
      const h = hitAt(e);
      if (!h) { cursor.visible = false; return; }
      const n = h.face!.normal.clone().transformDirection(mesh.matrixWorld);
      cursor.visible = true; cursor.position.copy(h.point).addScaledVector(n, 0.005);
      cursor.lookAt(h.point.clone().add(n)); cursor.scale.setScalar(opts.current.radius);
      if (!down) return;
      sculptAt(h.point, n);
      if (opts.current.symmetry && Math.abs(h.point.x) > 0.01) {
        sculptAt(new THREE.Vector3(-h.point.x, h.point.y, h.point.z), new THREE.Vector3(-n.x, n.y, n.z));
      }
    };
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const h = hitAt(e); if (!h) return;
      down = true; ctrl.enabled = false;
      const p = mesh.geometry.attributes.position.array as Float32Array;
      undoRef.current.push(new Float32Array(p)); if (undoRef.current.length > 20) undoRef.current.shift();
      stroke(e);
    };
    const onUp = () => { down = false; ctrl.enabled = true; };
    r.domElement.addEventListener("pointerdown", onDown);
    r.domElement.addEventListener("pointermove", stroke);
    window.addEventListener("pointerup", onUp);
    r.domElement.addEventListener("contextmenu", (e) => e.preventDefault());

    let raf = 0;
    const tick = () => { ctrl.update(); r.render(scene, cam); raf = requestAnimationFrame(tick); };
    tick();
    const ro = new ResizeObserver(() => { cam.aspect = mount.clientWidth / mount.clientHeight; cam.updateProjectionMatrix(); r.setSize(mount.clientWidth, mount.clientHeight); });
    ro.observe(mount);
    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); window.removeEventListener("pointerup", onUp);
      r.dispose(); mount.removeChild(r.domElement);
    };
  }, []);

  useEffect(() => {
    const m = meshRef.current; if (!m) return;
    const mat = m.material as THREE.MeshStandardMaterial; mat.color.set(color); mat.wireframe = wire;
  }, [color, wire]);

  const newBase = (b: Base) => { setBase(b); setGeometry(makeBase(b)); };
  const undo = () => {
    const prev = undoRef.current.pop(); const m = meshRef.current; if (!prev || !m) { toast.info("Nothing to undo"); return; }
    (m.geometry.attributes.position.array as Float32Array).set(prev);
    m.geometry.attributes.position.needsUpdate = true; m.geometry.computeVertexNormals();
  };
  const exportGLB = () => {
    const m = meshRef.current; if (!m) return;
    const out = new THREE.Mesh(m.geometry.clone(), (m.material as THREE.Material).clone()); out.name = "sculpt";
    new GLTFExporter().parse(out, (res) => {
      const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([res as ArrayBuffer], { type: "model/gltf-binary" }));
      a.download = "sculpt.glb"; a.click(); toast.success("Exported sculpt.glb");
    }, () => toast.error("Export failed"), { binary: true });
  };
  const sendTo3D = () => {
    const m = meshRef.current; if (!m) return;
    try { sendSculpt(m, color, `sculpt_${base}`); toast.success("Sent! Open the 3D Editor → model → Import sculpt"); }
    catch { toast.error("Sculpt too big to send — export the model and import the file instead"); }
  };
  const save = () => {
    const m = meshRef.current; if (!m) return;
    const p = m.geometry.attributes.position.array as Float32Array;
    const bytes = new Uint8Array(p.buffer.slice(0));
    let bin = ""; for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    try { localStorage.setItem(STORE, JSON.stringify({ base, color, pos: btoa(bin) })); toast.success("Sculpt saved on this device"); }
    catch { toast.error("Not enough space — export the model instead"); }
  };
  const load = () => {
    const raw = localStorage.getItem(STORE); if (!raw) { toast.error("Nothing saved yet"); return; }
    try {
      const d = JSON.parse(raw); const g = makeBase(d.base);
      const bin = atob(d.pos); const buf = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
      (g.attributes.position.array as Float32Array).set(new Float32Array(buf.buffer));
      g.computeVertexNormals(); setGeometry(g); setBase(d.base); setColor(d.color); toast.success("Sculpt loaded");
    } catch { toast.error("Saved sculpt is damaged"); }
  };

  const BRUSHES: { id: Brush; label: string }[] = [
    { id: "pull", label: "Pull" }, { id: "push", label: "Push" }, { id: "smooth", label: "Smooth" },
    { id: "flatten", label: "Flatten" }, { id: "pinch", label: "Pinch" },
  ];

  return (
    <div className="h-full flex flex-col bg-card text-xs">
      <div className="px-3 py-2 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2"><Hand className="w-4 h-4 text-primary" />Sculpt</h3>
        <div className="flex gap-1">
          <Button size="sm" variant="outline" className="h-6 px-2" onClick={undo} title="Undo stroke"><Undo2 className="w-3 h-3" /></Button>
          <Button size="sm" variant="outline" className="h-6 px-2" onClick={save} title="Save"><Save className="w-3 h-3" /></Button>
          <Button size="sm" variant="outline" className="h-6 px-2" onClick={load} title="Open"><FolderOpen className="w-3 h-3" /></Button>
          <Button size="sm" variant="outline" className="h-6 px-2" onClick={exportGLB} title="Export model"><Download className="w-3 h-3" /></Button>
        </div>
      </div>
      <div ref={mountRef} className="h-80 border-b border-border" />
      <div className="px-3 pt-2"><Button size="sm" className="w-full h-7 text-[10px]" onClick={sendTo3D}><Send className="w-3 h-3 mr-1" />Send to 3D Editor</Button></div>
      <div className="px-3 py-1 text-[10px] text-muted-foreground border-b border-border">Left-drag on the clay to sculpt · right-drag to turn · scroll to zoom</div>
      <div className="p-3 space-y-3 overflow-auto">
        <div>
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Brush</div>
          <div className="grid grid-cols-5 gap-1">
            {BRUSHES.map((b) => (
              <Button key={b.id} size="sm" variant={brush === b.id ? "default" : "outline"} className="h-7 text-[10px] px-1" onClick={() => setBrush(b.id)}>{b.label}</Button>
            ))}
          </div>
        </div>
        <div>
          <div className="flex justify-between"><span>Size</span><span className="text-muted-foreground">{radius.toFixed(2)}</span></div>
          <Slider min={0.05} max={0.8} step={0.01} value={[radius]} onValueChange={(v) => setRadius(v[0])} />
          <div className="flex justify-between mt-2"><span>Strength</span><span className="text-muted-foreground">{strength.toFixed(2)}</span></div>
          <Slider min={0.05} max={1} step={0.05} value={[strength]} onValueChange={(v) => setStrength(v[0])} />
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1"><input type="checkbox" checked={symmetry} onChange={(e) => setSymmetry(e.target.checked)} />Mirror left/right</label>
          <label className="flex items-center gap-1"><input type="checkbox" checked={wire} onChange={(e) => setWire(e.target.checked)} />Wireframe</label>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-6 h-6 ml-auto bg-transparent" aria-label="Clay color" />
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Start from</div>
          <div className="grid grid-cols-4 gap-1">
            {(["head", "sphere", "box", "cylinder"] as Base[]).map((b) => (
              <Button key={b} size="sm" variant={base === b ? "default" : "outline"} className="h-7 text-[10px] capitalize" onClick={() => newBase(b)}>
                {b === base ? <RotateCcw className="w-3 h-3 mr-1" /> : null}{b}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SculptStudio;

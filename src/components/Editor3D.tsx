// Unified 3D Editor — shared viewport, mode tabs (Scene / Character / City).
// Character mode uses a bone-parented low-poly rig with procedural walk/run/idle/wave.
// Click a body part to select it and pose it with sliders. Export whole scene as GLB.
import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Box as BoxIcon, User, Building2, Trees, Waves, Route, Car, Eraser,
  Play, Pause, Download, Trash2, Wand2, RotateCcw, Sparkles, Gamepad2, Plus,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";

type Mode = "scene" | "character" | "city";
type Anim = "idle" | "walk" | "run" | "wave" | "none";
type Tool = "building" | "road" | "tree" | "water" | "car" | "erase";

// ─── City config ────────────────────────────────────────────────
const GRID = 24;
const CELL = 1.2;
interface Cell { tool: Tool; height: number; color: string; }
const cityKey = (x: number, z: number) => `${x},${z}`;

const TOOL_META: Record<Tool, { icon: any; label: string }> = {
  building: { icon: Building2, label: "Bldg" },
  road:     { icon: Route,     label: "Road" },
  tree:     { icon: Trees,     label: "Tree" },
  water:    { icon: Waves,     label: "Water" },
  car:      { icon: Car,       label: "Car" },
  erase:    { icon: Eraser,    label: "Erase" },
};

// ─── Character rig ──────────────────────────────────────────────
interface Rig {
  root: THREE.Group;
  bones: Record<string, THREE.Group>;
  parts: Record<string, THREE.Mesh>;
  rest: Record<string, THREE.Euler>;
}

const CHAR_PRESETS = {
  hero:  { skin: "#f4c9a0", hair: "#3b2417", shirt: "#3b82f6", pants: "#1f2937", height: 1.0 },
  anime: { skin: "#ffe4c4", hair: "#ec4899", shirt: "#ffffff", pants: "#0f172a", height: 0.95 },
  ninja: { skin: "#d4a373", hair: "#000000", shirt: "#111827", pants: "#111827", height: 1.0 },
  robot: { skin: "#94a3b8", hair: "#22d3ee", shirt: "#64748b", pants: "#334155", height: 1.05 },
};
type Preset = keyof typeof CHAR_PRESETS;

function buildCharacter(preset: Preset, opts: { height: number; head: number }): Rig {
  const p = CHAR_PRESETS[preset];
  const H = opts.height * p.height;
  const skin = new THREE.MeshStandardMaterial({ color: p.skin, roughness: 0.8 });
  const hair = new THREE.MeshStandardMaterial({ color: p.hair, roughness: 0.9 });
  const shirt = new THREE.MeshStandardMaterial({ color: p.shirt, roughness: 0.7 });
  const pants = new THREE.MeshStandardMaterial({ color: p.pants, roughness: 0.7 });

  const root = new THREE.Group(); root.name = "character_root";
  const bones: Record<string, THREE.Group> = {};
  const parts: Record<string, THREE.Mesh> = {};
  const rest: Record<string, THREE.Euler> = {};

  const bone = (name: string, parent: THREE.Object3D, pos: [number, number, number]) => {
    const b = new THREE.Group(); b.name = name;
    b.position.set(...pos); parent.add(b);
    bones[name] = b; rest[name] = b.rotation.clone();
    return b;
  };
  const meshAt = (name: string, geom: THREE.BufferGeometry, mat: THREE.Material, bn: THREE.Object3D, offset: [number, number, number]) => {
    const m = new THREE.Mesh(geom, mat); m.position.set(...offset); m.castShadow = true; m.name = name;
    (m.userData as any).partName = name;
    bn.add(m); parts[name] = m; return m;
  };

  const hips = bone("hips", root, [0, 0.9 * H, 0]);
  const spine = bone("spine", hips, [0, 0.25 * H, 0]);
  const neck = bone("neck", spine, [0, 0.28 * H, 0]);
  const head = bone("head", neck, [0, 0.05 * H, 0]);

  meshAt("pelvis", new THREE.BoxGeometry(0.35 * H, 0.2 * H, 0.22 * H), pants, hips, [0, 0, 0]);
  meshAt("torso", new THREE.BoxGeometry(0.44 * H, 0.35 * H, 0.24 * H), shirt, spine, [0, 0.08 * H, 0]);
  meshAt("head", new THREE.SphereGeometry(0.13 * H * opts.head, 16, 16), skin, head, [0, 0.13 * H, 0]);
  // hair cap
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.135 * H * opts.head, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2), hair);
  cap.position.set(0, 0.13 * H, 0); head.add(cap);
  // eyes
  for (const sx of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.02 * H, 8, 8), new THREE.MeshBasicMaterial({ color: 0x0f172a }));
    eye.position.set(sx * 0.045 * H, 0.13 * H, 0.11 * H * opts.head); head.add(eye);
  }

  // Arms
  for (const side of ["L", "R"] as const) {
    const sx = side === "L" ? 1 : -1;
    const shoulder = bone(`${side}_shoulder`, spine, [sx * 0.24 * H, 0.22 * H, 0]);
    meshAt(`${side}_upperArm`, new THREE.CylinderGeometry(0.05 * H, 0.05 * H, 0.28 * H, 8), skin, shoulder, [0, -0.14 * H, 0]);
    const elbow = bone(`${side}_elbow`, shoulder, [0, -0.28 * H, 0]);
    meshAt(`${side}_forearm`, new THREE.CylinderGeometry(0.045 * H, 0.045 * H, 0.26 * H, 8), skin, elbow, [0, -0.13 * H, 0]);
    const wrist = bone(`${side}_wrist`, elbow, [0, -0.26 * H, 0]);
    meshAt(`${side}_hand`, new THREE.SphereGeometry(0.055 * H, 8, 8), skin, wrist, [0, -0.03 * H, 0]);
  }

  // Legs
  for (const side of ["L", "R"] as const) {
    const sx = side === "L" ? 1 : -1;
    const hip = bone(`${side}_hip`, hips, [sx * 0.1 * H, -0.05 * H, 0]);
    meshAt(`${side}_thigh`, new THREE.CylinderGeometry(0.065 * H, 0.06 * H, 0.35 * H, 8), pants, hip, [0, -0.18 * H, 0]);
    const knee = bone(`${side}_knee`, hip, [0, -0.35 * H, 0]);
    meshAt(`${side}_shin`, new THREE.CylinderGeometry(0.055 * H, 0.05 * H, 0.32 * H, 8), skin, knee, [0, -0.16 * H, 0]);
    const ankle = bone(`${side}_ankle`, knee, [0, -0.32 * H, 0]);
    meshAt(`${side}_foot`, new THREE.BoxGeometry(0.09 * H, 0.05 * H, 0.16 * H), pants, ankle, [0, -0.025 * H, 0.03 * H]);
  }

  return { root, bones, parts, rest };
}

function animateRig(rig: Rig, anim: Anim, t: number) {
  const b = rig.bones;
  // reset to rest each frame for cleanliness
  for (const k in b) b[k].rotation.copy(rig.rest[k]);
  rig.root.position.y = 0;

  if (anim === "idle") {
    const s = Math.sin(t * 2) * 0.05;
    b.spine.rotation.x = s;
    b.head.rotation.y = Math.sin(t * 0.8) * 0.15;
    rig.root.position.y = Math.abs(Math.sin(t * 2)) * 0.02;
  } else if (anim === "walk" || anim === "run") {
    const speed = anim === "run" ? 6 : 3.5;
    const amp = anim === "run" ? 1.1 : 0.7;
    const s = Math.sin(t * speed);
    const c = Math.cos(t * speed);
    b.L_hip.rotation.x = s * amp;
    b.R_hip.rotation.x = -s * amp;
    b.L_knee.rotation.x = Math.max(0, -s * amp * 0.8);
    b.R_knee.rotation.x = Math.max(0, s * amp * 0.8);
    b.L_shoulder.rotation.x = -s * amp * 0.9;
    b.R_shoulder.rotation.x = s * amp * 0.9;
    b.L_elbow.rotation.x = Math.abs(s) * 0.5;
    b.R_elbow.rotation.x = Math.abs(s) * 0.5;
    b.spine.rotation.y = s * 0.1;
    rig.root.position.y = Math.abs(c) * (anim === "run" ? 0.08 : 0.04);
  } else if (anim === "wave") {
    b.R_shoulder.rotation.z = -2.2;
    b.R_shoulder.rotation.x = -0.3;
    b.R_elbow.rotation.x = -0.4;
    b.R_elbow.rotation.z = Math.sin(t * 6) * 0.5;
    b.head.rotation.y = 0.2;
  }
}

const Editor3D = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const ctrlRef = useRef<OrbitControls | null>(null);
  const clockRef = useRef(new THREE.Clock());

  const rigRef = useRef<Rig | null>(null);
  const charGroupRef = useRef<THREE.Group | null>(null);
  const cityGroupRef = useRef<THREE.Group | null>(null);
  const sceneGroupRef = useRef<THREE.Group | null>(null);
  const cityMapRef = useRef<Map<string, Cell>>(new Map());
  const paintingRef = useRef(false);
  const animRef = useRef<Anim>("idle");
  const posePartRef = useRef<string | null>(null);

  const [mode, setMode] = useState<Mode>("character");
  // Character state
  const [preset, setPreset] = useState<Preset>("hero");
  const [height, setHeight] = useState(1.0);
  const [headScale, setHeadScale] = useState(1.0);
  const [anim, setAnim] = useState<Anim>("idle");
  const [playing, setPlaying] = useState(true);
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [poseRot, setPoseRot] = useState<[number, number, number]>([0, 0, 0]);
  // City state
  const [tool, setTool] = useState<Tool>("building");
  const [bh, setBh] = useState(3);
  const [bcolor, setBcolor] = useState("#64748b");
  // Scene AI
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  // Walk-around play mode
  const [walking, setWalking] = useState(false);
  const walkingRef = useRef(false);
  const keysRef = useRef<Record<string, boolean>>({});
  const velYRef = useRef(0);
  const yawRef = useRef(0);
  walkingRef.current = walking;

  animRef.current = playing ? anim : "none";

  // ─── Character rebuild ─────────────────────────────────────
  const rebuildChar = useCallback(() => {
    const scene = sceneRef.current; if (!scene) return;
    if (charGroupRef.current) { scene.remove(charGroupRef.current); charGroupRef.current.traverse(o => (o as any).geometry?.dispose?.()); }
    const rig = buildCharacter(preset, { height, head: headScale });
    const group = new THREE.Group(); group.name = "char"; group.add(rig.root);
    scene.add(group);
    charGroupRef.current = group;
    rigRef.current = rig;
    posePartRef.current = null;
    setSelectedPart(null);
  }, [preset, height, headScale]);

  // ─── City rebuild ──────────────────────────────────────────
  const rebuildCity = useCallback(() => {
    const scene = sceneRef.current; if (!scene) return;
    if (cityGroupRef.current) scene.remove(cityGroupRef.current);
    const g = new THREE.Group(); g.name = "city";
    for (const [k, cell] of cityMapRef.current.entries()) {
      const [x, z] = k.split(",").map(Number);
      const wx = (x - GRID / 2) * CELL + CELL / 2;
      const wz = (z - GRID / 2) * CELL + CELL / 2;
      const mat = new THREE.MeshStandardMaterial({ color: cell.color, roughness: 0.75 });
      if (cell.tool === "building") {
        const m = new THREE.Mesh(new THREE.BoxGeometry(CELL * 0.85, cell.height, CELL * 0.85), mat);
        m.position.set(wx, cell.height / 2, wz); g.add(m);
      } else if (cell.tool === "road") {
        const m = new THREE.Mesh(new THREE.BoxGeometry(CELL, 0.04, CELL), new THREE.MeshStandardMaterial({ color: 0x1f2937 }));
        m.position.set(wx, 0.02, wz); g.add(m);
      } else if (cell.tool === "tree") {
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.5, 8), new THREE.MeshStandardMaterial({ color: 0x6b3a1a }));
        trunk.position.set(wx, 0.25, wz); g.add(trunk);
        const leaves = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.9, 8), new THREE.MeshStandardMaterial({ color: cell.color }));
        leaves.position.set(wx, 0.9, wz); g.add(leaves);
      } else if (cell.tool === "water") {
        const m = new THREE.Mesh(new THREE.BoxGeometry(CELL, 0.08, CELL), new THREE.MeshStandardMaterial({ color: cell.color, roughness: 0.2, metalness: 0.6, transparent: true, opacity: 0.85 }));
        m.position.set(wx, 0.04, wz); g.add(m);
      } else if (cell.tool === "car") {
        const body = new THREE.Mesh(new THREE.BoxGeometry(CELL * 0.4, 0.2, CELL * 0.7), mat);
        body.position.set(wx, 0.15, wz); g.add(body);
      }
    }
    sceneRef.current!.add(g); cityGroupRef.current = g;
  }, []);

  // ─── Init THREE ────────────────────────────────────────────
  useEffect(() => {
    const mount = mountRef.current; if (!mount) return;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e1a);
    scene.fog = new THREE.Fog(0x0a0e1a, 25, 90);
    sceneRef.current = scene;

    const cam = new THREE.PerspectiveCamera(50, mount.clientWidth / mount.clientHeight, 0.1, 300);
    cam.position.set(3, 2.5, 4);
    cameraRef.current = cam;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.shadowMap.enabled = true;
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ctrl = new OrbitControls(cam, renderer.domElement);
    ctrl.enableDamping = true; ctrl.target.set(0, 1, 0);
    ctrlRef.current = ctrl;

    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const sun = new THREE.DirectionalLight(0xffffff, 1);
    sun.position.set(10, 15, 8); sun.castShadow = true; scene.add(sun);
    scene.add(new THREE.DirectionalLight(0xa855f7, 0.35));

    // Ground
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(GRID * CELL, GRID * CELL),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.95 })
    );
    ground.rotation.x = -Math.PI / 2; ground.name = "__ground__"; ground.receiveShadow = true;
    scene.add(ground);

    const grid = new THREE.GridHelper(GRID * CELL, GRID, 0x22d3ee, 0x1e293b);
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.25;
    scene.add(grid);

    // Raycast: city paint OR character part select
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const paintCity = (ev: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, cam);
      const hit = raycaster.intersectObject(ground)[0]; if (!hit) return;
      const cx = Math.floor(hit.point.x / CELL + GRID / 2);
      const cz = Math.floor(hit.point.z / CELL + GRID / 2);
      if (cx < 0 || cx >= GRID || cz < 0 || cz >= GRID) return;
      const k = cityKey(cx, cz);
      const t = (renderer.domElement.dataset.tool || "building") as Tool;
      if (t === "erase") cityMapRef.current.delete(k);
      else cityMapRef.current.set(k, {
        tool: t,
        height: parseFloat(renderer.domElement.dataset.bh || "3"),
        color: t === "tree" ? "#10b981" : t === "water" ? "#3b82f6" : (renderer.domElement.dataset.bcolor || "#64748b"),
      });
      rebuildCity();
    };

    const pickPart = (ev: PointerEvent) => {
      const rig = rigRef.current; if (!rig) return;
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, cam);
      const meshes = Object.values(rig.parts);
      const hit = raycaster.intersectObjects(meshes, false)[0];
      if (hit) {
        const name = (hit.object.userData as any).partName as string;
        posePartRef.current = name;
        setSelectedPart(name);
        // find nearest parent bone
      }
    };

    const onDown = (ev: PointerEvent) => {
      if (ev.button !== 0) return;
      const m = (renderer.domElement.dataset.mode || "character") as Mode;
      if (m === "city") { paintingRef.current = true; paintCity(ev); }
      else if (m === "character") pickPart(ev);
    };
    const onMove = (ev: PointerEvent) => {
      if (paintingRef.current && (renderer.domElement.dataset.mode as Mode) === "city") paintCity(ev);
    };
    const onUp = () => { paintingRef.current = false; };
    renderer.domElement.addEventListener("pointerdown", onDown);
    renderer.domElement.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    // Keyboard for walk mode
    const onKeyDown = (e: KeyboardEvent) => { keysRef.current[e.key.toLowerCase()] = true; };
    const onKeyUp = (e: KeyboardEvent) => { keysRef.current[e.key.toLowerCase()] = false; };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    let raf = 0;
    let prevT = 0;
    const tick = () => {
      const t = clockRef.current.getElapsedTime();
      const dt = Math.min(0.05, t - prevT); prevT = t;

      // ── Walk/play mode physics ──────────────────────────────
      if (walkingRef.current && charGroupRef.current && rigRef.current) {
        const k = keysRef.current;
        const forward = (k["w"] || k["arrowup"]) ? 1 : (k["s"] || k["arrowdown"]) ? -1 : 0;
        const strafe = (k["d"] || k["arrowright"]) ? 1 : (k["a"] || k["arrowleft"]) ? -1 : 0;
        const running = !!k["shift"];
        const speed = running ? 4.5 : 2.2;
        const moving = forward !== 0 || strafe !== 0;

        // Camera yaw controls facing direction
        const camDir = new THREE.Vector3();
        cam.getWorldDirection(camDir); camDir.y = 0; camDir.normalize();
        const right = new THREE.Vector3().crossVectors(camDir, new THREE.Vector3(0, 1, 0)).normalize();

        const move = new THREE.Vector3()
          .addScaledVector(camDir, forward)
          .addScaledVector(right, strafe);
        if (move.lengthSq() > 0) {
          move.normalize().multiplyScalar(speed * dt);
          const root = charGroupRef.current;
          const nextX = root.position.x + move.x;
          const nextZ = root.position.z + move.z;
          // Collision with buildings (AABB in grid space)
          const collides = (nx: number, nz: number) => {
            const cx = Math.floor(nx / CELL + GRID / 2);
            const cz = Math.floor(nz / CELL + GRID / 2);
            const cell = cityMapRef.current.get(cityKey(cx, cz));
            return cell?.tool === "building";
          };
          if (!collides(nextX, root.position.z)) root.position.x = nextX;
          if (!collides(root.position.x, nextZ)) root.position.z = nextZ;

          // Face movement direction
          yawRef.current = Math.atan2(move.x, move.z);
          root.rotation.y = yawRef.current;
        }

        // Gravity (character always on ground here, but keep ready)
        const root = charGroupRef.current;
        velYRef.current -= 9.8 * dt;
        root.position.y = Math.max(0, root.position.y + velYRef.current * dt);
        if (root.position.y <= 0) { root.position.y = 0; velYRef.current = 0; }
        if (k[" "] && root.position.y === 0) velYRef.current = 4.5; // jump

        // Force walk/run anim when moving
        animRef.current = moving ? (running ? "run" : "walk") : "idle";

        // Third-person chase camera
        const back = camDir.clone().multiplyScalar(-4);
        const desired = new THREE.Vector3(root.position.x + back.x, root.position.y + 2.2, root.position.z + back.z);
        cam.position.lerp(desired, 0.15);
        ctrl.target.lerp(new THREE.Vector3(root.position.x, root.position.y + 1.2, root.position.z), 0.2);
      }

      if (rigRef.current && animRef.current !== "none") animateRig(rigRef.current, animRef.current, t);
      ctrl.update();
      renderer.render(scene, cam);
      raf = requestAnimationFrame(tick);
    };
    tick();

    const onResize = () => {
      cam.aspect = mount.clientWidth / mount.clientHeight;
      cam.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    const ro = new ResizeObserver(onResize); ro.observe(mount);

    return () => {
      cancelAnimationFrame(raf); ro.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onDown);
      renderer.domElement.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, [rebuildCity]);

  // Build character on mount + when settings change
  useEffect(() => { rebuildChar(); }, [rebuildChar]);

  // Sync mode/tool onto canvas dataset for pointer handler
  useEffect(() => {
    const r = rendererRef.current; if (!r) return;
    r.domElement.dataset.mode = mode;
    r.domElement.dataset.tool = tool;
    r.domElement.dataset.bh = String(bh);
    r.domElement.dataset.bcolor = bcolor;
  }, [mode, tool, bh, bcolor]);

  // Toggle group visibility per mode (keep all alive so exports work)
  useEffect(() => {
    if (charGroupRef.current) charGroupRef.current.visible = mode === "character";
    if (cityGroupRef.current) cityGroupRef.current.visible = mode === "city";
    if (sceneGroupRef.current) sceneGroupRef.current.visible = mode === "scene";
    // Reframe camera
    const cam = cameraRef.current; const ctrl = ctrlRef.current;
    if (cam && ctrl) {
      if (mode === "character") { cam.position.set(2.5, 1.8, 3.2); ctrl.target.set(0, 1, 0); }
      if (mode === "city")      { cam.position.set(18, 20, 22); ctrl.target.set(0, 0, 0); }
      if (mode === "scene")     { cam.position.set(12, 10, 14); ctrl.target.set(0, 1, 0); }
      ctrl.update();
    }
  }, [mode]);

  // Apply pose slider values to selected part's parent bone
  useEffect(() => {
    const rig = rigRef.current; if (!rig || !selectedPart) return;
    // Find the bone group that owns this mesh
    const mesh = rig.parts[selectedPart]; if (!mesh) return;
    const bone = mesh.parent as THREE.Group;
    if (!bone) return;
    // Only apply when animation is paused, otherwise anim will overwrite
    if (!playing) {
      bone.rotation.set(poseRot[0], poseRot[1], poseRot[2]);
      if (rig.rest[bone.name]) rig.rest[bone.name] = new THREE.Euler(poseRot[0], poseRot[1], poseRot[2]);
    }
  }, [poseRot, selectedPart, playing]);

  // ── City procedural ────────────────────────────────────────
  const genCity = (style: "grid" | "downtown" | "suburb" | "island") => {
    cityMapRef.current.clear();
    if (style === "grid" || style === "downtown") {
      for (let i = 0; i < GRID; i++) for (let j = 0; j < GRID; j++) {
        if (i % 4 === 0 || j % 4 === 0) cityMapRef.current.set(cityKey(i, j), { tool: "road", height: 0, color: "#1f2937" });
      }
      for (let i = 0; i < GRID; i++) for (let j = 0; j < GRID; j++) {
        if (i % 4 === 0 || j % 4 === 0) continue;
        if (Math.random() > 0.25) {
          const d = Math.hypot(i - GRID / 2, j - GRID / 2);
          const h = style === "downtown" ? Math.max(2, 10 - d * 0.6 + Math.random() * 5) : 2 + Math.random() * 3;
          const palette = ["#334155", "#475569", "#64748b", "#1e293b"];
          cityMapRef.current.set(cityKey(i, j), { tool: "building", height: h, color: palette[Math.floor(Math.random() * palette.length)] });
        }
      }
    } else if (style === "suburb") {
      for (let i = 2; i < GRID; i += 6) for (let j = 0; j < GRID; j++) cityMapRef.current.set(cityKey(i, j), { tool: "road", height: 0, color: "#1f2937" });
      for (let i = 0; i < GRID; i++) for (let j = 0; j < GRID; j++) {
        if (i % 6 === 2) continue;
        if (Math.random() > 0.5) cityMapRef.current.set(cityKey(i, j), { tool: Math.random() > 0.6 ? "tree" : "building", height: 1.5 + Math.random() * 1.5, color: Math.random() > 0.5 ? "#78350f" : "#10b981" });
      }
    } else if (style === "island") {
      const cx = GRID / 2, cz = GRID / 2;
      for (let i = 0; i < GRID; i++) for (let j = 0; j < GRID; j++) {
        const d = Math.hypot(i - cx, j - cz);
        if (d > 8) cityMapRef.current.set(cityKey(i, j), { tool: "water", height: 0, color: "#3b82f6" });
        else if (d < 6 && Math.random() > 0.5) cityMapRef.current.set(cityKey(i, j), { tool: "building", height: 2 + Math.random() * 4, color: "#64748b" });
      }
    }
    rebuildCity();
    toast.success(`Generated ${style}`);
  };

  // ── Scene AI generate ──────────────────────────────────────
  const generateScene = async () => {
    if (!aiPrompt.trim()) return;
    setAiBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("scene-ai", { body: { prompt: aiPrompt } });
      if (error) throw error;
      const scene = data?.scene; if (!scene?.objects) throw new Error("Bad scene");
      if (sceneGroupRef.current) sceneRef.current!.remove(sceneGroupRef.current);
      const g = new THREE.Group(); g.name = "ai_scene";
      for (const o of scene.objects) {
        const mat = new THREE.MeshStandardMaterial({ color: o.color || "#64748b", roughness: 0.7 });
        let mesh: THREE.Object3D | null = null;
        const sx = o.sx || 1, sy = o.sy || 1, sz = o.sz || 1;
        if (o.kind === "box" || o.kind === "building") mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat);
        else if (o.kind === "sphere") mesh = new THREE.Mesh(new THREE.SphereGeometry(sx / 2, 16, 16), mat);
        else if (o.kind === "cylinder") mesh = new THREE.Mesh(new THREE.CylinderGeometry(sx / 2, sx / 2, sy, 16), mat);
        else if (o.kind === "cone" || o.kind === "tree") mesh = new THREE.Mesh(new THREE.ConeGeometry(sx / 2, sy, 12), mat);
        else if (o.kind === "road" || o.kind === "water") mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat);
        else mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat);
        if (mesh) { mesh.position.set(o.x || 0, o.y || 0, o.z || 0); g.add(mesh); }
      }
      sceneRef.current!.add(g); sceneGroupRef.current = g;
      toast.success(`Generated ${scene.objects.length} objects`);
    } catch (e: any) {
      toast.error("Scene generation failed", { description: e?.message });
    } finally { setAiBusy(false); }
  };

  // ── Export ─────────────────────────────────────────────────
  const exportGLB = () => {
    const scene = sceneRef.current; if (!scene) return;
    const targets: THREE.Object3D[] = [];
    if (charGroupRef.current?.visible) targets.push(charGroupRef.current);
    if (cityGroupRef.current?.visible) targets.push(cityGroupRef.current);
    if (sceneGroupRef.current?.visible) targets.push(sceneGroupRef.current);
    if (!targets.length && charGroupRef.current) targets.push(charGroupRef.current);
    const wrap = new THREE.Group();
    for (const t of targets) wrap.add(t.clone(true));
    const exp = new GLTFExporter();
    exp.parse(wrap, (result) => {
      const blob = result instanceof ArrayBuffer
        ? new Blob([result], { type: "model/gltf-binary" })
        : new Blob([JSON.stringify(result)], { type: "model/gltf+json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${mode}.${result instanceof ArrayBuffer ? "glb" : "gltf"}`;
      a.click(); URL.revokeObjectURL(url);
      toast.success(`Exported ${a.download}`);
    }, (err) => toast.error("Export failed", { description: String(err) }), { binary: true });
  };

  const selectedBoneName = selectedPart && rigRef.current?.parts[selectedPart]?.parent?.name;

  return (
    <div className="h-full flex flex-col bg-card">
      <div className="px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2 mb-1">
          <BoxIcon className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">3D Editor</h3>
        </div>
        <div className="flex gap-1">
          {(["character", "city", "scene"] as Mode[]).map((m) => {
            const Icon = m === "character" ? User : m === "city" ? Building2 : Sparkles;
            return (
              <Button key={m} size="sm" variant={mode === m ? "default" : "outline"}
                className="h-7 text-[10px] flex-1" onClick={() => setMode(m)}>
                <Icon className="w-3 h-3 mr-1" />{m}
              </Button>
            );
          })}
        </div>
      </div>

      <div ref={mountRef} className="h-72 border-b border-border bg-[#0a0e1a]" />

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3 text-xs">
          {mode === "character" && (
            <>
              <div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Preset</div>
                <div className="grid grid-cols-4 gap-1">
                  {(Object.keys(CHAR_PRESETS) as Preset[]).map((p) => (
                    <Button key={p} size="sm" variant={preset === p ? "default" : "outline"}
                      className="h-7 text-[10px] capitalize" onClick={() => setPreset(p)}>{p}</Button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Animation</div>
                <div className="grid grid-cols-4 gap-1">
                  {(["idle", "walk", "run", "wave"] as Anim[]).map((a) => (
                    <Button key={a} size="sm" variant={anim === a ? "default" : "outline"}
                      className="h-7 text-[10px] capitalize" onClick={() => { setAnim(a); setPlaying(true); }}>
                      {a}
                    </Button>
                  ))}
                </div>
                <div className="flex gap-1 mt-1">
                  <Button size="sm" variant="outline" className="h-7 text-[10px] flex-1"
                    onClick={() => setPlaying(!playing)}>
                    {playing ? <><Pause className="w-3 h-3 mr-1" />Pause (pose)</> : <><Play className="w-3 h-3 mr-1" />Play</>}
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-[10px] flex-1"
                    onClick={() => { setPoseRot([0, 0, 0]); rebuildChar(); toast.success("Reset pose"); }}>
                    <RotateCcw className="w-3 h-3 mr-1" />Reset
                  </Button>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1"><span>Height</span><span className="text-muted-foreground">{height.toFixed(2)}</span></div>
                <Slider min={0.6} max={1.6} step={0.05} value={[height]} onValueChange={(v) => setHeight(v[0])} />
                <div className="flex justify-between mb-1 mt-2"><span>Head</span><span className="text-muted-foreground">{headScale.toFixed(2)}</span></div>
                <Slider min={0.7} max={1.5} step={0.05} value={[headScale]} onValueChange={(v) => setHeadScale(v[0])} />
              </div>

              {!playing && selectedPart && (
                <div className="pt-2 border-t border-border">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                    Pose · <span className="text-primary">{selectedBoneName || selectedPart}</span>
                  </div>
                  {["X", "Y", "Z"].map((axis, i) => (
                    <div key={axis} className="mb-1">
                      <div className="flex justify-between text-[10px]"><span>Rot {axis}</span><span className="text-muted-foreground">{poseRot[i].toFixed(2)}</span></div>
                      <Slider min={-Math.PI} max={Math.PI} step={0.05} value={[poseRot[i]]}
                        onValueChange={(v) => { const n = [...poseRot] as [number, number, number]; n[i] = v[0]; setPoseRot(n); }} />
                    </div>
                  ))}
                </div>
              )}
              {!selectedPart && !playing && (
                <div className="text-[10px] text-muted-foreground">Pause + click a body part to pose it</div>
              )}
            </>
          )}

          {mode === "city" && (
            <>
              <div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Tool</div>
                <div className="grid grid-cols-3 gap-1">
                  {(Object.keys(TOOL_META) as Tool[]).map((t) => {
                    const Icon = TOOL_META[t].icon;
                    return (
                      <Button key={t} size="sm" variant={tool === t ? "default" : "outline"}
                        className="h-8 text-[10px] flex-col gap-0.5 px-1" onClick={() => setTool(t)}>
                        <Icon className="w-3.5 h-3.5" /><span>{TOOL_META[t].label}</span>
                      </Button>
                    );
                  })}
                </div>
              </div>
              {tool === "building" && (
                <div>
                  <div className="flex justify-between mb-1"><span>Height</span><span className="text-muted-foreground">{bh.toFixed(1)}</span></div>
                  <Slider min={1} max={12} step={0.5} value={[bh]} onValueChange={(v) => setBh(v[0])} />
                  <div className="flex items-center gap-2 mt-2">
                    <span className="w-14">Color</span>
                    <input type="color" value={bcolor} onChange={(e) => setBcolor(e.target.value)}
                      className="h-6 w-10 bg-transparent rounded cursor-pointer" />
                  </div>
                </div>
              )}
              <div className="pt-2 border-t border-border">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1 flex items-center gap-1">
                  <Wand2 className="w-3 h-3" /> Procedural
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {(["grid", "downtown", "suburb", "island"] as const).map((s) => (
                    <Button key={s} size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => genCity(s)}>{s}</Button>
                  ))}
                </div>
              </div>
              <Button size="sm" variant="outline" className="w-full h-7 text-[10px]"
                onClick={() => { cityMapRef.current.clear(); rebuildCity(); }}>
                <Trash2 className="w-3 h-3 mr-1" /> Clear city
              </Button>
            </>
          )}

          {mode === "scene" && (
            <>
              <div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">AI Scene</div>
                <Input placeholder="a medieval village near a river"
                  value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)}
                  className="h-8 text-xs mb-1" />
                <Button size="sm" className="w-full h-7 text-[10px]" onClick={generateScene} disabled={aiBusy}>
                  <Sparkles className="w-3 h-3 mr-1" />{aiBusy ? "Generating…" : "Generate"}
                </Button>
              </div>
              <Button size="sm" variant="outline" className="w-full h-7 text-[10px]"
                onClick={() => { if (sceneGroupRef.current) { sceneRef.current!.remove(sceneGroupRef.current); sceneGroupRef.current = null; } }}>
                <Trash2 className="w-3 h-3 mr-1" /> Clear scene
              </Button>
            </>
          )}

          <div className="pt-2 border-t border-border">
            <Button size="sm" className="w-full h-7 text-[10px]" onClick={exportGLB}>
              <Download className="w-3 h-3 mr-1" /> Export {mode}.glb
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default Editor3D;

// Auto-rig a sculpt: a vertical bone chain with height-based skin weights + preset animations.
import * as THREE from "three";

export type RigAnim = "sway" | "bounce" | "dance" | "nod";
export const BONES = 5;

/** For a vertex at height t (0 = bottom, 1 = top), return its two bones and weights. */
export const boneWeights = (t: number, n = BONES): [number, number, number, number] => {
  const f = Math.min(Math.max(t, 0), 1) * (n - 1);
  const i = Math.min(Math.floor(f), n - 2);
  const w = f - i;
  return [i, i + 1, 1 - w, w];
};

export const buildRig = (geo: THREE.BufferGeometry, mat: THREE.Material) => {
  const g = geo.clone(); g.computeBoundingBox();
  const bounds = g.boundingBox;
  if (!bounds) throw new Error("Cannot rig geometry without bounds");
  const { min, max } = bounds; const h = Math.max(max.y - min.y, 1e-4);
  const pos = g.attributes.position; const si: number[] = []; const sw: number[] = [];
  for (let i = 0; i < pos.count; i++) {
    const [a, b, wa, wb] = boneWeights((pos.getY(i) - min.y) / h);
    si.push(a, b, 0, 0); sw.push(wa, wb, 0, 0);
  }
  g.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(si, 4));
  g.setAttribute("skinWeight", new THREE.Float32BufferAttribute(sw, 4));
  const bones: THREE.Bone[] = [];
  for (let i = 0; i < BONES; i++) {
    const b = new THREE.Bone(); b.name = `bone${i}`;
    b.position.y = i === 0 ? min.y : h / (BONES - 1);
    if (i) bones[i - 1].add(b); bones.push(b);
  }
  const mesh = new THREE.SkinnedMesh(g, mat); mesh.name = "rigged_sculpt";
  mesh.add(bones[0]); mesh.bind(new THREE.Skeleton(bones));
  return mesh;
};

const q = (x: number, y: number, z: number) => new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z)).toArray();

export const makeClip = (anim: RigAnim): THREE.AnimationClip => {
  const times = [0, 0.5, 1, 1.5, 2];
  const tracks: THREE.KeyframeTrack[] = [];
  for (let i = 1; i < BONES; i++) {
    const k = i / BONES; let vals: number[] = [];
    if (anim === "sway") vals = [0, 0.15, 0, -0.15, 0].flatMap((a) => q(0, 0, a * k));
    else if (anim === "dance") vals = [0, 1, 0, -1, 0].flatMap((a) => q(0.1 * a * k, 0.3 * a * k, 0.2 * a));
    else if (anim === "nod") vals = [0, 1, 0, 1, 0].flatMap((a) => q(i >= BONES - 2 ? 0.25 * a : 0, 0, 0));
    else vals = [0, 1, 0, 1, 0].flatMap((a) => q(0.08 * a * (i % 2 ? 1 : -1), 0, 0));
    tracks.push(new THREE.QuaternionKeyframeTrack(`bone${i}.quaternion`, times, vals));
  }
  if (anim === "bounce") tracks.push(new THREE.VectorKeyframeTrack("bone0.scale", times, [1,1,1, 1.05,0.9,1.05, 1,1,1, 1.05,0.9,1.05, 1,1,1]));
  return new THREE.AnimationClip(anim, 2, tracks);
};

/** A saved pose: time in seconds + [x,y,z] rotation for every bone. */
export interface PoseKey { t: number; rot: [number, number, number][] }

/** Build an animation from your own poses, sorted by time. Needs at least 2 poses. */
export const clipFromKeys = (keys: PoseKey[]): THREE.AnimationClip | null => {
  if (keys.length < 2) return null;
  const ks = [...keys].sort((a, b) => a.t - b.t);
  const times = ks.map((k) => k.t);
  const tracks = Array.from({ length: ks[0].rot.length }, (_, i) =>
    new THREE.QuaternionKeyframeTrack(`bone${i}.quaternion`, times, ks.flatMap((k) => q(...k.rot[i]))));
  return new THREE.AnimationClip("custom", times[times.length - 1], tracks);
};

// ---------- Human skeleton: spine, head, two arms, two legs ----------
export type HumanAnim = "walk" | "wave" | "dance" | "nod";
// [name, parent, joint x (fraction of half-width), joint y (fraction of height)]
export const HUMAN: [string, number, number, number][] = [
  ["Hips", -1, 0, 0.5], ["Spine", 0, 0, 0.62], ["Chest", 1, 0, 0.75], ["Head", 2, 0, 0.86],
  ["L arm", 2, 0.84, 0.75], ["L forearm", 4, 0.84, 0.56], ["R arm", 2, -0.84, 0.75], ["R forearm", 6, -0.84, 0.56],
  ["L thigh", 0, 0.3, 0.48], ["L shin", 8, 0.3, 0.25], ["R thigh", 0, -0.3, 0.48], ["R shin", 10, -0.3, 0.25],
];
const ENDS: Record<number, [number, number]> = { 3: [0, 1], 5: [0.84, 0.39], 7: [-0.84, 0.39], 9: [0.3, 0], 11: [-0.3, 0] };

const segDist = (px: number, py: number, ax: number, ay: number, bx: number, by: number) => {
  const dx = bx - ax, dy = by - ay; const l = dx * dx + dy * dy || 1e-6;
  const t = Math.min(1, Math.max(0, ((px - ax) * dx + (py - ay) * dy) / l));
  return Math.hypot(px - ax - t * dx, py - ay - t * dy);
};

/** Pick the 2 closest bones to a point (x = fraction of half-width, y = fraction of height) and blend them. */
export const humanWeights = (fx: number, fy: number): [number, number, number, number] => {
  const d = HUMAN.map(([, , x, y], i) => {
    const child = HUMAN.findIndex((b) => b[1] === i && (i !== 0 || b[0] === "Spine") && (i !== 2 || b[0] === "Head"));
    const [ex, ey] = ENDS[i] ?? [HUMAN[child][2], HUMAN[child][3]];
    return segDist(fx, fy, x, y, ex, ey);
  });
  const order = d.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]);
  const [a, b] = [order[0][1], order[1][1]];
  const wa = 1 / Math.pow(d[a] + 1e-3, 4), wb = 1 / Math.pow(d[b] + 1e-3, 4);
  return [a, b, wa / (wa + wb), wb / (wa + wb)];
};

export const buildHumanRig = (geo: THREE.BufferGeometry, mat: THREE.Material) => {
  const g = geo.clone(); g.computeBoundingBox();
  const bounds = g.boundingBox;
  if (!bounds) throw new Error("Cannot rig geometry without bounds");
  const { min, max } = bounds; const h = Math.max(max.y - min.y, 1e-4);
  const cx = (min.x + max.x) / 2, hw = Math.max((max.x - min.x) / 2, 1e-4);
  const pos = g.attributes.position; const si: number[] = []; const sw: number[] = [];
  for (let i = 0; i < pos.count; i++) {
    const [a, b, wa, wb] = humanWeights((pos.getX(i) - cx) / hw, (pos.getY(i) - min.y) / h);
    si.push(a, b, 0, 0); sw.push(wa, wb, 0, 0);
  }
  g.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(si, 4));
  g.setAttribute("skinWeight", new THREE.Float32BufferAttribute(sw, 4));
  const world = HUMAN.map(([, , x, y]) => new THREE.Vector3(cx + x * hw, min.y + y * h, 0));
  const bones = HUMAN.map(([, p], i) => {
    const b = new THREE.Bone(); b.name = `bone${i}`;
    b.position.copy(p < 0 ? world[i] : world[i].clone().sub(world[p])); return b;
  });
  HUMAN.forEach(([, p], i) => { if (p >= 0) bones[p].add(bones[i]); });
  const mesh = new THREE.SkinnedMesh(g, mat); mesh.name = "rigged_character";
  mesh.add(bones[0]); mesh.bind(new THREE.Skeleton(bones));
  return mesh;
};

export const makeHumanClip = (anim: HumanAnim): THREE.AnimationClip => {
  const times = [0, 0.5, 1, 1.5, 2]; const s = [0, 1, 0, -1, 0];
  const tr = (i: number, f: (a: number) => [number, number, number]) =>
    new THREE.QuaternionKeyframeTrack(`bone${i}.quaternion`, times, s.flatMap((a) => q(...f(a))));
  let tracks: THREE.KeyframeTrack[] = [];
  if (anim === "walk") tracks = [tr(8, (a) => [0.5 * a, 0, 0]), tr(10, (a) => [-0.5 * a, 0, 0]),
    tr(9, (a) => [-0.4 * Math.abs(a), 0, 0]), tr(11, (a) => [-0.4 * Math.abs(a), 0, 0]),
    tr(4, (a) => [-0.4 * a, 0, 0]), tr(6, (a) => [0.4 * a, 0, 0])];
  else if (anim === "wave") tracks = [tr(6, () => [0, 0, -2.4]), tr(7, (a) => [0, 0, -0.5 * a])];
  else if (anim === "dance") tracks = [tr(1, (a) => [0, 0, 0.2 * a]), tr(4, (a) => [0, 0, 1.2 + 0.4 * a]),
    tr(6, (a) => [0, 0, -1.2 + 0.4 * a]), tr(3, (a) => [0, 0, -0.2 * a])];
  else tracks = [tr(3, (a) => [0.3 * Math.abs(a), 0, 0])];
  return new THREE.AnimationClip(anim, 2, tracks);
};

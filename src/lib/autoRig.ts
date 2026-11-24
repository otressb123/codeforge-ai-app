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
  const { min, max } = g.boundingBox!; const h = Math.max(max.y - min.y, 1e-4);
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

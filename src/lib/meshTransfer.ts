// Pass sculpted meshes between studios (Sculpt → 3D Editor) and store them offline.
import * as THREE from "three";

const OUTBOX = "codeforge.sculpt.outbox.v1";

const toB64 = (arr: ArrayBufferView) => {
  const bytes = new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
  let bin = ""; for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
};
const fromB64 = (s: string) => {
  const bin = atob(s); const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
};

export interface EncodedMesh { pos: string; index: string | null; color: string; name: string }

export const encodeGeometry = (g: THREE.BufferGeometry) => ({
  pos: toB64(g.attributes.position.array as Float32Array),
  index: g.index ? toB64(new Uint32Array(g.index.array)) : null,
});

export const decodeGeometry = (pos: string, index: string | null) => {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(fromB64(pos)), 3));
  if (index) g.setIndex(new THREE.BufferAttribute(new Uint32Array(fromB64(index)), 1));
  g.computeVertexNormals();
  return g;
};

export const sendSculpt = (mesh: THREE.Mesh, color: string, name = "sculpt") => {
  const data: EncodedMesh = { ...encodeGeometry(mesh.geometry), color, name };
  localStorage.setItem(OUTBOX, JSON.stringify(data));
};

export const receiveSculpt = (): EncodedMesh | null => {
  try { const raw = localStorage.getItem(OUTBOX); return raw ? JSON.parse(raw) : null; } catch { return null; }
};

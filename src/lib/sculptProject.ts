import * as THREE from "three";
import { z } from "zod";
import { encodeGeometry, decodeGeometry } from "./meshTransfer";
import { BONES, HUMAN } from "./autoRig";

const rotation = z.tuple([z.number().finite(), z.number().finite(), z.number().finite()]);
const schema = z.object({
  version: z.literal(2),
  base: z.enum(["sphere", "head", "box", "cylinder", "body"]),
  color: z.string().regex(/^#[0-9a-f]{6}$/i),
  geometry: z.object({ pos: z.string(), index: z.string().nullable() }),
  skeleton: z.enum(["chain", "human"]),
  animation: z.enum(["none", "pose", "custom", "walk", "wave", "dance", "nod", "sway", "bounce"]),
  rotations: z.array(rotation),
  keys: z.array(z.object({ t: z.number().finite().nonnegative(), rot: z.array(rotation) })),
});

export type SculptProject = z.infer<typeof schema>;

export const serializeSculptProject = (geometry: THREE.BufferGeometry, project: Omit<SculptProject, "version" | "geometry">) =>
  JSON.stringify({ ...project, version: 2, geometry: encodeGeometry(geometry) });

export const parseSculptProject = (raw: string): { project: SculptProject; geometry: THREE.BufferGeometry } => {
  const project = schema.parse(JSON.parse(raw));
  const count = project.skeleton === "human" ? HUMAN.length : BONES;
  if (project.rotations.length !== count || project.keys.some((key) => key.rot.length !== count))
    throw new Error("Pose does not match the skeleton");
  if (project.animation === "custom" && (project.keys.length < 2 || new Set(project.keys.map((key) => key.t)).size !== project.keys.length))
    throw new Error("Custom animation needs distinct pose times");
  if ((project.skeleton === "human" && ["sway", "bounce"].includes(project.animation)) ||
    (project.skeleton === "chain" && ["walk", "wave"].includes(project.animation)))
    throw new Error("Animation does not match the skeleton");
  const geometry = decodeGeometry(project.geometry.pos, project.geometry.index);
  const position = geometry.getAttribute("position");
  const indices = geometry.index;
  if (!position.count || position.array.length % 3 ||
      Array.from(position.array).some((value) => !Number.isFinite(value)) ||
      (indices && (indices.count % 3 || Array.from(indices.array).some((value) => value >= position.count)))) {
    geometry.dispose();
    throw new Error("Invalid sculpt geometry");
  }
  return { project, geometry };
};
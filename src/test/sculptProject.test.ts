import { describe, it, expect } from "vitest";
import * as THREE from "three";
import { parseSculptProject, serializeSculptProject, type SculptProject } from "@/lib/sculptProject";
import { buildHumanRig, makeHumanClip, clipFromKeys } from "@/lib/autoRig";

const state = (): Omit<SculptProject, "version" | "geometry"> => ({
  base: "body", color: "#e8c4a8", skeleton: "human", animation: "walk",
  rotations: Array.from({ length: 12 }, () => [0, 0, 0]), keys: [],
});

describe("offline character projects", () => {
  it("restores edited geometry and the twelve-bone walking skeleton", () => {
    const geometry = new THREE.BoxGeometry(1, 2, 1);
    geometry.attributes.position.setX(0, 0.72);
    const saved = parseSculptProject(serializeSculptProject(geometry, state()));
    expect(Array.from(saved.geometry.attributes.position.array)).toEqual(Array.from(geometry.attributes.position.array));
    expect(Array.from(saved.geometry.index?.array ?? [])).toEqual(Array.from(geometry.index?.array ?? []));
    expect(saved.project.animation).toBe("walk");
    const rig = buildHumanRig(saved.geometry, new THREE.MeshStandardMaterial());
    const mixer = new THREE.AnimationMixer(rig); mixer.clipAction(makeHumanClip("walk")).play(); mixer.update(0.5);
    expect(rig.skeleton.bones.length).toBe(12);
    expect(rig.skeleton.bones[8].rotation.x).toBeCloseTo(0.5);
  });
  it("preserves custom pose times and separate limb rotations in backups", () => {
    const project = state(); project.animation = "custom";
    const bent = project.rotations.map((r) => [...r] as [number, number, number]); bent[7][2] = 0.8;
    project.keys = [{ t: 0, rot: project.rotations }, { t: 1.5, rot: bent }];
    project.rotations = bent;
    const restored = parseSculptProject(serializeSculptProject(new THREE.BoxGeometry(), project));
    expect(restored.project.rotations[7][2]).toBe(0.8);
    const clip = clipFromKeys(restored.project.keys);
    expect(clip?.duration).toBe(1.5); expect(clip?.tracks).toHaveLength(12);
  });
  it("rejects mismatched skeleton poses without replacing the current character", () => {
    const project = state(); project.rotations = project.rotations.slice(0, 5);
    expect(() => parseSculptProject(serializeSculptProject(new THREE.BoxGeometry(), project))).toThrow("Pose does not match");
  });
  it("rejects walking on the simple chain skeleton", () => {
    const project = state(); project.skeleton = "chain"; project.rotations = project.rotations.slice(0, 5);
    expect(() => parseSculptProject(serializeSculptProject(new THREE.BoxGeometry(), project))).toThrow("Animation does not match");
  });
});
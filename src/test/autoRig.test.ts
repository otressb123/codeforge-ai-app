import { describe, it, expect } from "vitest";
import { boneWeights } from "@/lib/autoRig";
describe("autoRig", () => {
  it("bottom of the sculpt follows only the first bone", () => expect(boneWeights(0)).toEqual([0, 1, 1, 0]));
  it("top of the sculpt follows only the last bone", () => expect(boneWeights(1)).toEqual([3, 4, 0, 1]));
  it("weights always add up to 1", () => { const [, , a, b] = boneWeights(0.37); expect(a + b).toBeCloseTo(1); });
});
import { clipFromKeys } from "@/lib/autoRig";
describe("custom poses", () => {
  const z = () => Array.from({ length: 5 }, () => [0, 0, 0] as [number, number, number]);
  it("needs at least 2 poses to animate", () => expect(clipFromKeys([{ t: 0, rot: z() }])).toBeNull());
  it("animation lasts until the last pose", () => {
    const c = clipFromKeys([{ t: 2, rot: z() }, { t: 0, rot: z() }]);
    if (!c) throw new Error("Expected custom animation");
    expect(c.duration).toBe(2); expect(c.tracks[0].times[0]).toBe(0);
  });
});
import { humanWeights, HUMAN, buildHumanRig, makeHumanClip } from "@/lib/autoRig";
import * as THREE from "three";
describe("human skeleton", () => {
  const name = (fx: number, fy: number) => HUMAN[humanWeights(fx, fy)[0]][0];
  it("left hand follows the left forearm", () => expect(name(0.84, 0.48)).toBe("L forearm"));
  it("right foot follows the right shin", () => expect(name(-0.3, 0.05)).toBe("R shin"));
  it("top of the head follows the head", () => expect(name(0, 0.97)).toBe("Head"));
  it("walking moves opposite legs independently", () => {
    const rig = buildHumanRig(new THREE.BoxGeometry(1, 2, 1), new THREE.MeshStandardMaterial());
    const mixer = new THREE.AnimationMixer(rig);
    mixer.clipAction(makeHumanClip("walk")).play(); mixer.update(0.5);
    expect(rig.skeleton.bones[8].rotation.x).toBeCloseTo(0.5);
    expect(rig.skeleton.bones[10].rotation.x).toBeCloseTo(-0.5);
    expect(rig.skeleton.bones[3].rotation.x).toBe(0);
  });
  it("custom poses include all twelve human bones", () => {
    const rot = HUMAN.map(() => [0, 0, 0] as [number, number, number]);
    const clip = clipFromKeys([{t: 0, rot}, {t: 1, rot}]);
    expect(clip?.tracks.length).toBe(12);
    expect(clip?.tracks[11].name).toBe("bone11.quaternion");
  });
});

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
    const c = clipFromKeys([{ t: 2, rot: z() }, { t: 0, rot: z() }])!;
    expect(c.duration).toBe(2); expect(c.tracks[0].times[0]).toBe(0);
  });
});

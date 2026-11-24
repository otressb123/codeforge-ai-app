import { describe, it, expect } from "vitest";
import { boneWeights } from "@/lib/autoRig";
describe("autoRig", () => {
  it("bottom of the sculpt follows only the first bone", () => expect(boneWeights(0)).toEqual([0, 1, 1, 0]));
  it("top of the sculpt follows only the last bone", () => expect(boneWeights(1)).toEqual([3, 4, 0, 1]));
  it("weights always add up to 1", () => { const [, , a, b] = boneWeights(0.37); expect(a + b).toBeCloseTo(1); });
});

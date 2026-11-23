import { describe, it, expect } from "vitest";
import * as THREE from "three";
import { encodeGeometry, decodeGeometry } from "@/lib/meshTransfer";

describe("meshTransfer", () => {
  it("keeps a sculpted shape identical after sending it to the 3D Editor", () => {
    const g = new THREE.SphereGeometry(1, 8, 6);
    (g.attributes.position as THREE.BufferAttribute).setX(3, 2.5);
    const e = encodeGeometry(g);
    const back = decodeGeometry(e.pos, e.index);
    expect(back.attributes.position.count).toBe(g.attributes.position.count);
    expect(back.attributes.position.getX(3)).toBeCloseTo(2.5);
    expect(back.index!.count).toBe(g.index!.count);
  });
});

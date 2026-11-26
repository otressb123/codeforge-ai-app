# Architecture rules

- Keep sculpt skinning and animation construction in `src/lib/autoRig.ts`, shared by posing and GLB export, so both use identical bone indices.
# Architecture rules

- Keep sculpt skinning and animation construction in `src/lib/autoRig.ts`, shared by posing and GLB export, so both use identical bone indices.
- Keep versioned sculpt project serialization and validation in `src/lib/sculptProject.ts`, shared by device saves and downloadable backups, so both restore the same geometry and rig state.
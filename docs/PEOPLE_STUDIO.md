# People Studio

Tab **ស្ទូឌីយោ · Studio** inside KHOEM-AI 3D (next to Vehicles and People).

- Loads the rigged model `public/characters/fashion-model.glb` (clips: `SambaDance`, `TPose`).
- Shows it on a grid floor at one or more body heights in a row (small adult, woman, man, tall, very tall).
- Every person plays the selected clip, each starting at a different point so they do not move in step.
- Camera presets (front, 3/4, side, rear, top), auto-turn, pause.
- A missing or invalid `.glb` is reported as `NOT FOUND`; no stand-in figure is drawn.

Files: `src/vehicles3d/PeopleStudio.tsx` (view), `src/vehicles3d/peopleStudio.mjs` (pure helpers, tested),
`tests/peopleStudio.test.mjs`.

Heights are the studio's own presets (the 1.67 m woman matches the original viewer). More models: add a `.glb`
with the same kind of rig and extend `PRESETS` / `STUDIO_MODEL`.

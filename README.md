# KHOEM-AI 3D Studio

A browser-based 3D asset library and modeling studio built with React, TypeScript, Three.js, and Vite.

## Features

### 3D Asset Library
- Import images (PNG, JPEG, WebP, GIF) and 3D models (GLB, GLTF).
- Preview images and 3D models.
- Search assets and filter by type.
- Remove assets from the library.
- Store asset files locally using IndexedDB.
- Export and restore asset backups in JSON format.


### 3D Objects
- Create Box, Sphere, Cone, Cylinder, Torus, and 3D Text.
- Move, rotate, and scale objects.
- Multi-select, multi-delete, and multi-duplicate.
- Group objects and select by group.
- Rename, hide, lock, and search objects.

### Materials and Textures
- Edit material colors.
- Adjust metalness and roughness.
- Upload textures.
- Use material presets and HDRI environment reflections.

### Lighting and Camera
- Day, Night, and Studio lighting presets.
- Ambient and directional lighting.
- Real-time shadows and background color.
- Orbit, pan, zoom, and camera presets.

### Scene Management
- Save, load, and duplicate scenes.
- Automatic saving and backup recovery.
- Scene thumbnails, search, and sorting.
- Rename and delete scenes.
- Import and export all scenes.

### 3D Pages (one button group)
Every 3D page opens from the same button group on the home screen. One page is open at a time; press the button again to close it.

| Button | Page |
|---|---|
| 3D Studio | 3D Creation Studio |
| KHOEM-AI 3D | Vehicles and People |
| Karaoke 3D | Karaoke / Pub |
| Hospital 3D | Hospital |
| School 3D | School |
| Village 3D | Village |
| Ocean World 3D | Ocean World and Prison Island |

To add or remove a 3D page, edit the `MODULES` list in `src/App.tsx` and its viewer block (`isOpen("id")`). Nothing else needs to change.

### Import and Export
- Import GLB models and text files.
- Export GLB models and PNG screenshots.
- Export interactive HTML viewers.
- Import and export scene JSON.

### Workflow and Mobile
- Undo and redo.
- Keyboard shortcuts and onboarding tour.
- Settings and reset controls.
- Responsive, touch-friendly interface.

## Technology Stack

| Technology | Purpose |
|---|---|
| React | User interface |
| TypeScript | Type safety |
| Three.js | 3D rendering |
| Vite | Development and build |
| IndexedDB | Asset storage |
| LocalStorage | Scene persistence |

## Quick Start

### Requirements
- Node.js
- npm
- A modern web browser

### Installation

```bash
git clone https://github.com/KHOEM-AI/MI-K.git MI-K-VISION-3D
cd MI-K-VISION-3D
npm install
npm run dev
```

### Development Commands

```bash
npm run dev
npm run typecheck
npm test
npm run build
npm run preview
```

## Project Structure

```text
src/
├── components/
│   ├── Studio3D.tsx
│   ├── UI3DPreview.tsx
│   ├── CameraPresets.tsx
│   ├── SceneLightingPanel.tsx
│   ├── MaterialPanel.tsx
│   ├── TransformPanel.tsx
│   └── ModelViewer.tsx
├── lib/
│   ├── storage.mjs
│   ├── backup.mjs
│   └── sceneStorage.mjs
├── App.tsx
├── main.tsx
└── style.css
```

## Verification

```bash
npm run typecheck
npm test
npm run build
git diff --check
```

## Repository

[KHOEM-AI/MI-K](https://github.com/KHOEM-AI/MI-K)

## Run with the whole KHOEM-AI stack

The 3D studio is started by the `ai` command (`~/KSV/ai.sh`) together with the KI API (:5001), AI (:5175), IQ-AI, KSV and the other services.

| Service | URL |
|---|---|
| MI-K VISION 3D | http://localhost:5176 |

~~~bash
ai          # start everything (3D studio on :5176)
ai stop     # stop everything
bash ai.sh  # same as `ai` (thin wrapper)
~~~

Port 5173 belongs to the KSV UI, so run the 3D studio alone on another port:

~~~bash
npm run dev -- --port 5176
~~~

The launcher listens on 127.0.0.1 only. To open it from another device on the same network: `MIK_HOST=0.0.0.0 ai`.

## Owner
This project and the 'Ocean World & Prison Island' module are the exclusive property of **@KHOEM-AI**.

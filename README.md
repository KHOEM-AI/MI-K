KHOEM-AI 3D

KHOEM-AI 3D is a browser-based 3D asset library and modeling studio built with React, TypeScript, Three.js, and Vite.

The application provides tools to manage 3D assets, create and edit 3D scenes, customize materials, and export models as GLB files.

Features

3D Asset Library

- Import and manage images, GLB, and GLTF assets.
- Preview 3D models.
- Search and filter the asset library.
- Store assets locally using IndexedDB.
- Export and import JSON backups.

3D Studio

- Create Box, Sphere, Cone, Cylinder, and Torus objects.
- Add, select, duplicate, and delete scene objects.
- Move, rotate, and scale objects.
- Edit material colors.
- Adjust metalness and roughness.
- Undo and redo scene changes.
- Export 3D scenes as GLB files.

Interface

- KHOEM-AI branding.
- Day and Night themes.
- Responsive application interface.

Technology Stack

- React
- TypeScript
- Three.js
- Vite
- IndexedDB
- Node.js
- npm

Requirements

- Node.js
- npm
- A modern web browser

Installation

Clone the repository:

git clone https://github.com/KHOEM-AI/MI-K.git
cd MI-K
npm install

Development

Start the development server:

npm run dev

Available Scripts

Command| Description
npm run dev| Start the development server
npm run build| Build the production application
npm run preview| Preview the production build
npm test| Run the test suite
npm run typecheck| Check TypeScript types

Testing

Run the tests:

npm test

Check TypeScript:

npm run typecheck

Production Build

Build the application:

npm run build

Preview the production build:

npm run preview

Project Structure

MI-K-VISION-3D/
├── src/
│   ├── components/
│   ├── lib/
│   └── App.tsx
├── tests/
├── public/
├── package.json
└── README.md

Project Status

KHOEM-AI 3D is under active development. New features and improvements may be added in future updates.

Repository

https://github.com/KHOEM-AI/MI-K

Author

KHOEM-AI

---

Copyright belongs to the project owner.


Stage Feature Commit
1-3 Multi-object + Transform + Material (មុន)
4-6 Light + Save/Load + JSON 056d313 → 0b10202
7 Auto Backup 47617a8
8 Scene Hierarchy 5dde0d0
9 Texture Upload bdb375c
10 Camera Presets 9e6457d
11 Grid Snapping 4835be2
12 Lighting Presets 6e940ec
13 Background Color ac2cb33
14 Clear Scene df892af
15 Keyboard Shortcuts a5279ac
16 3D UI Preview ab22c15
17 GLB Import ca7a362
18 Fit to Center 853e887
19 Help Modal 63964cb
20 Button Unification 63964cb
21 Active Lighting 4e68e10
22 Pro Shortcuts 22d3037
23 Lazy Loading + Prefetch 970a6fa (implicit)
24 3D Text 63964cb
25 Real-time Shadows 63964cb
26 Preset Materials 63964cb
27 HDRI Environment Map 7bef573
28 Auto-Rotate Camera 9cdb198
29 Export PNG f14b31a
30a-g Refactor (7 components) f14b31a
31 Object Search 305832d ✅

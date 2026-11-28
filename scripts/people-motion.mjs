// Motion for the human figure built by src/components/humanFigure.ts.
// Pure maths, no three.js: a clip is a function of the cycle phase that returns, for each joint,
// a rotation OFFSET (radians, x/y/z) from the standing pose. people-lib.mjs turns the samples into
// three.js AnimationClips, which GLTFExporter writes into the .glb.
//
// Conventions (the figure faces +Z, its left hand is on +X):
//   rotation.x  <0 swings a leg/arm FORWARD, >0 backward;  a knee bends with x > 0, an elbow with x < 0.
//   rotation.z  >0 lifts the LEFT arm outwards, <0 lifts the RIGHT arm outwards.
//   spine rotation.x > 0 leans the body forward.

export const JOINTS = ["Hips", "Spine", "Head", "ArmL", "ArmR", "ElbowL", "ElbowR", "LegL", "LegR", "KneeL", "KneeR"];

const TAU = Math.PI * 2;
const { sin, cos } = Math;
const zero = () => [0, 0, 0];
const pos = (x) => (x + Math.abs(x)) / 2; // max(0, x), written smoothly enough for a gait

/* ---------- keeping the feet on the ground ----------
   The hips height is computed from the legs, so the lowest foot always touches the floor
   (walking bobs up and down by itself, nobody floats or sinks into the ground). */
const THIGH = 0.44;                                   // hip -> knee, from humanFigure.ts
const SOLE_Y = [-0.488, -0.476];                      // sole box bottom/top, in the knee's frame
const SOLE_Z = [0.045 - 0.1275, 0.045 + 0.1275];      // sole box back/front

/** Distance from the hip down to the lowest point of the shoe, for thigh angle theta and knee bend kappa. */
export function footDepth(theta, kappa) {
  const phi = theta + kappa, c = cos(phi), s = sin(phi);
  let low = Infinity;
  for (const y of SOLE_Y) for (const z of SOLE_Z) low = Math.min(low, y * c - z * s);
  return THIGH * cos(theta) - low;
}
const REST_DEPTH = footDepth(0, 0);

/** How far the hips must move from the standing height (figure's own units). Usually below 0; a tilted shoe can lift it by a hair. */
export function hipsOffset(legL, kneeL, legR, kneeR) {
  return Math.max(footDepth(legL, kneeL), footDepth(legR, kneeR)) - REST_DEPTH;
}

/* ---------- the clips ---------- */
function gait({ stride, knee, kneeBase, arm, elbow, elbowSwing, lean, twist }) {
  return (p) => {
    const s = sin(p), c = cos(p);
    return {
      Spine: [lean, twist * s, 0],
      Head: [-lean * 0.7, -twist * s * 0.8, 0],
      ArmL: [arm * s, 0, 0.06],
      ArmR: [-arm * s, 0, -0.06],
      ElbowL: [-elbow + elbowSwing * s, 0, 0],
      ElbowR: [-elbow - elbowSwing * s, 0, 0],
      LegL: [-stride * s, 0, 0],
      LegR: [stride * s, 0, 0],
      KneeL: [kneeBase + knee * pos(c), 0, 0],
      KneeR: [kneeBase + knee * pos(-c), 0, 0],
    };
  };
}

export const CLIPS = {
  // standing, breathing, a little weight shift
  idle: {
    duration: 4,
    pose: (p) => ({
      Spine: [0.015 * sin(p), 0.02 * sin(p), 0.02 * sin(p)],
      Head: [0.012 * sin(p + 0.8), 0.07 * sin(p), 0],
      ArmL: [0.03 * sin(p + 1), 0, 0.05],
      ArmR: [0.03 * sin(p + 3), 0, -0.05],
      ElbowL: [-0.04 * (1 + sin(p)), 0, 0],
      ElbowR: [-0.04 * (1 + sin(p + 2)), 0, 0],
    }),
  },
  // one full cycle = two steps
  walk: {
    duration: 1,
    pose: gait({ stride: 0.5, knee: 0.9, kneeBase: 0.08, arm: 0.45, elbow: 0.15, elbowSwing: 0.18, lean: 0.04, twist: 0.1 }),
  },
  run: {
    duration: 0.62,
    pose: gait({ stride: 0.85, knee: 1.5, kneeBase: 0.15, arm: 0.95, elbow: 1.1, elbowSwing: 0.25, lean: 0.2, twist: 0.16 }),
  },
  // right hand raised and waving
  wave: {
    duration: 2,
    pose: (p) => ({
      Spine: [0.015 * sin(p), 0, 0.03],
      Head: [0, -0.1, 0.06],
      ArmR: [0.3, 0, -2.7],
      ElbowR: [-0.5, 0, 0.45 * sin(2 * p)],
      ArmL: [0.02 * sin(p), 0, 0.05],
    }),
  },
  // talking: both hands in front of the chest, gesturing, head nodding
  talk: {
    duration: 3.2,
    pose: (p) => ({
      Spine: [0.02 * sin(2 * p), 0.05 * sin(p), 0],
      Head: [0.05 * sin(3 * p), 0.1 * sin(p), 0],
      ArmL: [-0.35 + 0.12 * sin(2 * p), 0, 0.18],
      ElbowL: [-1.05 + 0.35 * sin(2 * p + 0.9), 0, 0],
      ArmR: [-0.4 + 0.15 * sin(2 * p + 2.4), 0, -0.18],
      ElbowR: [-0.95 + 0.4 * sin(2 * p + 3.3), 0, 0],
    }),
  },
};

export const CLIP_NAMES = Object.keys(CLIPS);

/**
 * Samples one clip. The last key equals the first, so the clip loops without a jump.
 * Returns { name, duration, fps, times, joints: { Joint: [[x,y,z], ...] }, hipsY: [offset, ...] }.
 */
export function sampleClip(name, fps = 20) {
  const def = CLIPS[name];
  if (!def) throw new Error(`unknown clip: ${name}`);
  const steps = Math.max(2, Math.round(def.duration * fps));
  const times = [], hipsY = [], joints = Object.fromEntries(JOINTS.map((j) => [j, []]));
  for (let i = 0; i <= steps; i++) {
    const t = (i === steps ? def.duration : (i * def.duration) / steps);
    const pose = def.pose(i === steps ? 0 : (TAU * i) / steps); // the closing key repeats phase 0 exactly
    times.push(t);
    for (const j of JOINTS) joints[j].push(pose[j] ? [...pose[j]] : zero());
    const g = (j) => joints[j][i][0];
    hipsY.push(hipsOffset(g("LegL"), g("KneeL"), g("LegR"), g("KneeR")));
  }
  return { name, duration: def.duration, fps, times, joints, hipsY };
}

// Pure helpers for the People Studio (no three.js here, so they can be tested without WebGL).

export const STUDIO_MODEL = '/characters/fashion-model.glb';

// One rigged model, shown at several body heights (metres). The "woman" height matches the 1.67 m shown by the
// original viewer; the other heights are the studio's own presets.
export const PRESETS = [
  { id: 'small_adult', label: 'តូច · Small adult', height: 1.5 },
  { id: 'woman', label: 'ស្រី · Woman', height: 1.67 },
  { id: 'man', label: 'ប្រុស · Man', height: 1.78 },
  { id: 'tall', label: 'ខ្ពស់ · Tall', height: 1.9 },
  { id: 'very_tall', label: 'ខ្ពស់ណាស់ · Very tall', height: 2.05 },
];

export const DEFAULT_SELECTION = ['woman'];

const positive = (n, what) => {
  const v = Number(n);
  if (!(v > 0) || !Number.isFinite(v)) throw new Error(`${what} must be a positive number`);
  return v;
};

// Uniform scale that turns a model of height `current` into one of height `target`.
export const heightScale = (current, target) => positive(target, 'target height') / positive(current, 'current height');

// X positions of `count` people in one row, centred on 0.
export function lineupPositions(count, spacing = 1.1) {
  const n = Math.max(0, Math.floor(Number(count) || 0));
  const s = positive(spacing, 'spacing');
  return Array.from({ length: n }, (_, i) => (i - (n - 1) / 2) * s);
}

// Adds or removes a preset. Keeps the preset order and never leaves the stage empty.
export function togglePreset(selected, id) {
  if (!PRESETS.some((p) => p.id === id)) throw new Error(`unknown preset: ${id}`);
  const has = selected.includes(id);
  if (has && selected.length === 1) return [...selected];
  const next = has ? selected.filter((x) => x !== id) : [...selected, id];
  return PRESETS.map((p) => p.id).filter((x) => next.includes(x));
}

// Size of the stage: half width and height of the row for the given heights.
export function stageSize(heights, spacing = 1.1) {
  const hs = heights.map((h) => positive(h, 'height'));
  if (!hs.length) throw new Error('at least one person is needed');
  return { halfWidth: ((hs.length - 1) * positive(spacing, 'spacing')) / 2 + 0.6, height: Math.max(...hs) };
}

// Camera distance that keeps the whole stage in view for a vertical field of view (degrees) and a screen aspect
// (width / height). A tall phone screen is narrow, so the width can decide the distance.
export function fitStageDistance(stage, fovDeg, aspect) {
  const f = positive(fovDeg, 'fov');
  if (f >= 180) throw new Error('fov must be below 180');
  const t = Math.tan((f * Math.PI) / 360);
  const byHeight = (stage.height * 0.6) / t;
  const byWidth = stage.halfWidth / (t * positive(aspect, 'aspect'));
  return Math.max(byHeight, byWidth) * 1.15;
}

// Start time inside a clip so that people in one row do not move in step.
export function clipPhase(index, duration) {
  const d = Number(duration);
  if (!(d > 0)) return 0;
  return (Math.max(0, Math.floor(index)) * 0.37 * d) % d;
}

// The clip to start with: a dance clip when there is one, otherwise the first clip, otherwise nothing.
export function pickDefaultClip(names) {
  const list = (names || []).filter((n) => typeof n === 'string' && n);
  return list.find((n) => /dance|samba/i.test(n)) || list[0] || null;
}

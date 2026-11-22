// Single source of truth for where houses, doors, roads and public places are in Village3D.
// Houses, lights, villagers and tests all read this file, so nothing can drift apart.

export type Wealth = 0 | 1 | 2; // 0 = poor, 1 = middle, 2 = rich

export function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickWealth(rng: () => number): Wealth {
  const r = rng();
  if (r < 0.4) return 0;
  if (r < 0.8) return 1;
  return 2;
}

export const HOUSE_COUNT = 300;
export const HOUSE_COLS = 20;
export const HOUSE_SPACING_X = 9;
export const HOUSE_SPACING_Z = 10;
/** The two middle columns are the street. Houses start 13.5 units from the centre, outside the 10-wide road. */
export const STREET_COLS = [9, 10] as const;
export const ROAD_HALF_WIDTH = 5;
export const SIDEWALK_X = 7;

// House depth along the walking direction (see createVillageHousesInstanced): poor 4, middle 5.5, rich 7.
const HOUSE_DEPTH: Record<Wealth, number> = { 0: 4, 1: 5.5, 2: 7 };

export interface HouseSlot {
  index: number;
  col: number;
  row: number;
  x: number;
  z: number;
  rotY: number;
  wealth: Wealth;
  /** Front door, on the street side of the house. */
  door: { x: number; z: number };
}

export function gridOrigin(count = HOUSE_COUNT) {
  const usable = HOUSE_COLS - STREET_COLS.length;
  const rows = Math.ceil(count / usable);
  return {
    rows,
    startX: -((HOUSE_COLS - 1) * HOUSE_SPACING_X) / 2,
    startZ: -((rows - 1) * HOUSE_SPACING_Z) / 2,
  };
}

export function houseSlots(count = HOUSE_COUNT, seed = 42): HouseSlot[] {
  const rng = mulberry32(seed);
  const { rows, startX, startZ } = gridOrigin(count);
  const out: HouseSlot[] = [];
  for (let r = 0; r < rows && out.length < count; r++) {
    for (let c = 0; c < HOUSE_COLS && out.length < count; c++) {
      if ((STREET_COLS as readonly number[]).includes(c)) continue;
      const west = c < STREET_COLS[0];
      const wealth = pickWealth(rng);
      const x = startX + c * HOUSE_SPACING_X;
      const z = startZ + r * HOUSE_SPACING_Z;
      out.push({
        index: out.length, col: c, row: r, x, z, wealth,
        rotY: west ? Math.PI / 2 : -Math.PI / 2,
        door: { x: x + (west ? 1 : -1) * (HOUSE_DEPTH[wealth] / 2 + 0.8), z },
      });
    }
  }
  return out;
}

/* ---------- public places (same coordinates Village3D uses) ---------- */
export type PlaceKind = "field" | "factory" | "market" | "shop" | "plaza";
export interface Place {
  id: string;
  kind: PlaceKind;
  x: number;
  z: number;
  /** People spread inside this radius so nobody stands on the same spot. */
  radius: number;
  /** true = people go inside the building and are hidden until they leave */
  indoor: boolean;
}

export const PLACES: Place[] = [
  { id: "factory", kind: "factory", x: 0, z: -100, radius: 3, indoor: true },
  { id: "field-nw", kind: "field", x: -140, z: -120, radius: 10, indoor: false },
  { id: "field-ne", kind: "field", x: 140, z: -120, radius: 10, indoor: false },
  { id: "field-sw", kind: "field", x: -140, z: 120, radius: 10, indoor: false },
  { id: "field-se", kind: "field", x: 140, z: 120, radius: 10, indoor: false },
  { id: "market-1", kind: "market", x: -70, z: 60, radius: 5, indoor: false },
  { id: "market-2", kind: "market", x: 70, z: 60, radius: 5, indoor: false },
  { id: "market-3", kind: "market", x: -70, z: -60, radius: 5, indoor: false },
  { id: "market-4", kind: "market", x: 70, z: -60, radius: 5, indoor: false },
  { id: "shop-1", kind: "shop", x: -40, z: 66, radius: 1.5, indoor: true },
  { id: "shop-2", kind: "shop", x: -15, z: 66, radius: 1.5, indoor: true },
  { id: "shop-3", kind: "shop", x: 15, z: 66, radius: 1.5, indoor: true },
  { id: "shop-4", kind: "shop", x: 45, z: 66, radius: 1.5, indoor: true },
  { id: "plaza", kind: "plaza", x: 0, z: 0, radius: 12, indoor: false },
];

export const placesOf = (kind: PlaceKind) => PLACES.filter((p) => p.kind === kind);

/* ---------- walking routes that follow the street, not straight lines through houses ---------- */
export interface Pt { x: number; z: number }

/** z of the lane between two house rows that is closest to z. */
export function alleyZ(z: number, count = HOUSE_COUNT): number {
  const { startZ } = gridOrigin(count);
  const first = startZ + HOUSE_SPACING_Z / 2;
  return first + Math.round((z - first) / HOUSE_SPACING_Z) * HOUSE_SPACING_Z;
}

export function planRoute(from: Pt, to: Pt): Pt[] {
  const sideOf = (x: number, other: number) => (Math.abs(x) > ROAD_HALF_WIDTH + 1 ? Math.sign(x) : Math.sign(other) || 1);
  const sF = sideOf(from.x, to.x);
  const sT = sideOf(to.x, from.x);
  const aF = alleyZ(from.z);
  const aT = alleyZ(to.z);
  const raw: Pt[] = [from];
  const nearStreet = (p: Pt) => Math.abs(p.x) <= ROAD_HALF_WIDTH + 2;
  if (!nearStreet(from)) raw.push({ x: from.x, z: aF }, { x: sF * SIDEWALK_X, z: aF });
  else raw.push({ x: sF * SIDEWALK_X, z: from.z });
  if (!nearStreet(to)) raw.push({ x: sF * SIDEWALK_X, z: aT }, { x: sT * SIDEWALK_X, z: aT }, { x: to.x, z: aT });
  else raw.push({ x: sF * SIDEWALK_X, z: to.z });
  raw.push(to);
  const out: Pt[] = [];
  for (const p of raw) {
    const last = out[out.length - 1];
    if (!last || Math.hypot(p.x - last.x, p.z - last.z) > 0.05) out.push(p);
  }
  return out;
}

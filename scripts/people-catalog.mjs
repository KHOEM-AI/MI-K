// Who gets exported: skin tones, heights and outfits. Heights are real-world metres; K turns them into scene units
// (the same 1.14 units per metre the village vehicles use, so a 1.75 m person is about 2 units tall).

export const K = 1.143;

export const TONES = {
  fair: 0xf1d3b8,
  light: 0xe3b894,
  medium: 0xc99672,
  tan: 0xa8704c,
  brown: 0x7d4e33,
  deep: 0x573523,
};
export const TONE_NAMES = Object.keys(TONES);

const UNIFORM = { shirt: 0xf6f6f4, pants: 0x1f3c88 };
const GREY = 0xc9c9c9;

export const PEOPLE = [
  { id: "child_boy", heightM: 1.10, tone: "medium", opts: { ...UNIFORM, longSleeves: false } },
  { id: "child_girl", heightM: 1.07, tone: "light", opts: { ...UNIFORM, skirt: true, hairStyle: "long", longSleeves: false } },
  { id: "teen_boy", heightM: 1.55, tone: "tan", opts: { ...UNIFORM, longSleeves: false } },
  { id: "teen_girl", heightM: 1.50, tone: "medium", opts: { ...UNIFORM, skirt: true, hairStyle: "bun", longSleeves: false } },
  { id: "woman", heightM: 1.58, tone: "light", opts: { female: true, shirt: 0xe17055, pants: 0x2d3436 } },
  { id: "man", heightM: 1.68, tone: "tan", opts: { shirt: 0x3b6ea5, pants: 0x2c3e50 } },
  { id: "tall_woman", heightM: 1.72, tone: "fair", opts: { female: true, shirt: 0x6c5ce7, pants: 0x2d3436, hair: 0x3b2a1e } },
  { id: "tall_man", heightM: 1.82, tone: "brown", opts: { shirt: 0x00897b, pants: 0x37474f } },
  { id: "elder_woman", heightM: 1.50, tone: "medium", opts: { female: true, shirt: 0x8e44ad, skirt: true, pants: 0x4a3b5c, hair: GREY, hairStyle: "bun" } },
  { id: "elder_man", heightM: 1.62, tone: "tan", opts: { shirt: 0xf0e6d2, pants: 0x4a4a4a, hair: GREY } },
  { id: "farmer", heightM: 1.66, tone: "brown", opts: { shirt: 0x6d7b4f, pants: 0x3e3a2f, hat: "cap", hatColor: 0xc9a86a } },
  { id: "teacher", heightM: 1.62, tone: "light", opts: { female: true, shirt: 0xf7f1e1, pants: 0x2d3436, skirt: true, hairStyle: "bun" } },
  { id: "doctor", heightM: 1.72, tone: "fair", opts: { shirt: 0xffffff, pants: 0x2c7a7b, coat: true } },
  { id: "nurse", heightM: 1.60, tone: "deep", opts: { female: true, shirt: 0xffffff, pants: 0x2c7a7b, hat: "nurse", hairStyle: "bun" } },
];

/** Options for createHumanFigure. Always full detail (never the phone "lite" crowd version). */
export function figureOptions(person, tone = person.tone) {
  if (!(tone in TONES)) throw new Error(`unknown skin tone: ${tone}`);
  return { detail: "high", lite: false, height: person.heightM * K, skin: TONES[tone], ...person.opts };
}

export const NAME_OK = /^[a-z][a-z0-9_]{0,40}$/;

export function validatePeople(people = PEOPLE) {
  const problems = [], seen = new Set();
  for (const p of people) {
    if (!NAME_OK.test(p.id)) problems.push(`${p.id}: unsafe id (use a-z, 0-9, _)`);
    if (seen.has(p.id)) problems.push(`${p.id}: duplicate`);
    seen.add(p.id);
    if (!(p.heightM >= 0.5 && p.heightM <= 2.3)) problems.push(`${p.id}: height ${p.heightM} m is not realistic`);
    if (!(p.tone in TONES)) problems.push(`${p.id}: unknown tone ${p.tone}`);
  }
  return problems;
}

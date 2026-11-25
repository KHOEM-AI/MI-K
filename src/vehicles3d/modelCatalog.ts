export type ModelCategory = "animal" | "house" | "tool" | "vehicle";

export interface ModelEntry {
  id: string;
  name: string;
  khmerName: string;
  category: ModelCategory;
}

export const CATEGORIES: ModelCategory[] = ["animal", "house", "tool", "vehicle"];

export const CATEGORY_META: Record<ModelCategory, { label: string; khmer: string }> = {
  animal:  { label: "Animals",  khmer: "សត្វ" },
  house:   { label: "Houses",   khmer: "ផ្ទះ" },
  tool:    { label: "Tools",    khmer: "ឧបករណ៍" },
  vehicle: { label: "Vehicles", khmer: "យានយន្ត" },
};

export const CATEGORY_FOLDER: Record<ModelCategory, string> = {
  animal:  "animals",
  house:   "houses",
  tool:    "tools",
  vehicle: "vehicles",
};

export const CATEGORY_FIT_SIZE: Record<ModelCategory, number> = {
  animal: 2.5,
  house: 6,
  tool: 1.2,
  vehicle: 2.5,
};

// Every entry below has a real GLB in public/models/<folder>/<id>.glb
export const MODELS: ModelEntry[] = [
  // ─── animals (7) ────────────────────────────────────────
  { id: "elephant", name: "Elephant", khmerName: "ដំរី",     category: "animal" },
  { id: "tiger",    name: "Tiger",    khmerName: "ខ្លា",      category: "animal" },
  { id: "cow",      name: "Cow",      khmerName: "គោ",       category: "animal" },
  { id: "dog",      name: "Dog",      khmerName: "ឆ្កែ",      category: "animal" },
  { id: "bird",     name: "Bird",     khmerName: "បក្សី",     category: "animal" },
  { id: "fish",     name: "Fish",     khmerName: "ត្រី",      category: "animal" },
  { id: "snake",    name: "Snake",    khmerName: "ពស់",      category: "animal" },

  // ─── houses (6) ─────────────────────────────────────────
  { id: "villa",        name: "Villa",        khmerName: "វីឡា",           category: "house" },
  { id: "wooden-house", name: "Wooden House", khmerName: "ផ្ទះឈើ",        category: "house" },
  { id: "school",       name: "School",       khmerName: "សាលា",           category: "house" },
  { id: "hospital",     name: "Hospital",     khmerName: "មន្ទីរពេទ្យ",     category: "house" },
  { id: "apartment",    name: "Apartment",    khmerName: "អាផាតមិន",      category: "house" },
  { id: "shophouse",    name: "Shophouse",    khmerName: "ផ្ទះជួល",        category: "house" },

  // ─── tools (3) ──────────────────────────────────────────
  { id: "forklift",          name: "Forklift",          khmerName: "រថយន្តលើកទំនិញ", category: "tool" },
  { id: "assembly-line",     name: "Assembly Line",     khmerName: "ខ្សែសង្វាក់ផលិត",  category: "tool" },
  { id: "warehouse-shelves", name: "Warehouse Shelves", khmerName: "ធ្នើរឃ្លាំង",       category: "tool" },

  // ─── vehicles (4) ───────────────────────────────────────
  { id: "sedan",      name: "Sedan",      khmerName: "ឡាន",          category: "vehicle" },
  { id: "motorcycle", name: "Motorcycle", khmerName: "ម៉ូតូ",         category: "vehicle" },
  { id: "bicycle",    name: "Bicycle",    khmerName: "កង់",          category: "vehicle" },
  { id: "helicopter", name: "Helicopter", khmerName: "ឧទ្ធម្ភាគចក្រ", category: "vehicle" },
];

export function modelsByCategory(cat: ModelCategory): ModelEntry[] {
  return MODELS.filter((m) => m.category === cat);
}

export function glbPath(entry: ModelEntry): string {
  return `/models/${CATEGORY_FOLDER[entry.category]}/${entry.id}.glb`;
}

import { Trees, Armchair, Clapperboard, Route } from "lucide-react";
import type { SceneObject, Shape } from "./studioTypes";
import { createId } from "./studioConstants";

export type SceneTemplate = "park" | "room" | "studio" | "highway";

type EnvironmentTemplatesProps = {
  onLoadTemplate: (template: SceneTemplate) => void;
  disabled?: boolean;
};

type TemplateItem = {
  id: SceneTemplate;
  name: string;
  icon: React.ComponentType<{ size?: number }>;
  description: string;
};

const TEMPLATES: TemplateItem[] = [
  { id: "park", name: "Park", icon: Trees, description: "ដើមឈើ + ផ្ទះ + ចង្កៀង" },
  { id: "room", name: "Room", icon: Armchair, description: "សាឡុង + តុ + កៅអី" },
  { id: "studio", name: "Studio", icon: Clapperboard, description: "ឡាន + ស្ទូឌីយោ" },
  { id: "highway", name: "Highway", icon: Route, description: "ផ្លូវភ្លោះ + ឡាន ៣ គ្រឿង" },
];

export function EnvironmentTemplates({ onLoadTemplate, disabled }: EnvironmentTemplatesProps) {
  return (
    <div className="studio-transform-panel">
      <h3>Environment Templates</h3>
      <p className="studio-note" style={{ marginBottom: "12px" }}>
        ជ្រើសរើស Template ដើម្បីចាប់ផ្តើម Scene យ៉ាងឆាប់រហ័ស (នឹងជំនួស Scene បច្ចុប្បន្ន)
      </p>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {TEMPLATES.map((tpl) => {
          const Icon = tpl.icon;
          return (
            <button
              key={tpl.id}
              type="button"
              className="upload-button"
              disabled={disabled}
              onClick={() => {
                if (window.confirm(`បង្កើត Scene ថ្មីជា "${tpl.name}"? (Scene បច្ចុប្បន្ននឹងត្រូវជំនួស)`)) {
                  onLoadTemplate(tpl.id);
                }
              }}
              style={{
                flex: "1 1 calc(50% - 4px)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "12px 8px",
                gap: "6px",
              }}
              title={tpl.description}
            >
              <Icon size={24} />
              <span style={{ fontSize: "0.9rem" }}>{tpl.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Template Factories ─────────────────────────────────────────────

function makeObject(
  shape: Shape,
  name: string,
  position: { x: number; y: number; z: number },
  color: string,
  metalness = 0.25,
  roughness = 0.35
): SceneObject {
  return {
    id: createId(),
    name,
    shape,
    color,
    metalness,
    roughness,
    position,
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    visible: true,
    locked: false,
    textureData: null,
  };
}

export function generateTemplate(template: SceneTemplate): SceneObject[] {
  if (template === "park") {
    return [
      makeObject("house", "House", { x: 0, y: 0, z: -4 }, "#d4a373", 0.1, 0.7),
      makeObject("tree", "Tree 1", { x: -4, y: 0, z: 0 }, "#2d5016", 0.05, 0.8),
      makeObject("tree", "Tree 2", { x: 4, y: 0, z: -1 }, "#2d5016", 0.05, 0.8),
      makeObject("tree", "Tree 3", { x: -3, y: 0, z: 3 }, "#2d5016", 0.05, 0.8),
      makeObject("lamp", "Lamp", { x: 2.5, y: 0, z: 2.5 }, "#fbbf24", 0.1, 0.4),
    ];
  }
  if (template === "room") {
    return [
      makeObject("sofa", "Sofa", { x: 0, y: 0, z: -3 }, "#4a5568", 0.1, 0.9),
      makeObject("table", "Coffee Table", { x: 0, y: 0, z: 0 }, "#8b4513", 0.1, 0.7),
      makeObject("chair", "Chair 1", { x: -3, y: 0, z: -3 }, "#654321", 0.1, 0.7),
      makeObject("chair", "Chair 2", { x: 3, y: 0, z: -3 }, "#654321", 0.1, 0.7),
      makeObject("lamp", "Floor Lamp", { x: 3.5, y: 0, z: -4 }, "#fbbf24", 0.1, 0.4),
      makeObject("box", "TV Stand", { x: 0, y: 0.5, z: -4.5 }, "#1a1a1a", 0.6, 0.4),
    ];
  }
  if (template === "highway") {
    return [
      makeObject("highway", "Dual Highway", { x: 0, y: 0, z: 0 }, "#2a2a2a", 0.1, 0.9),
      makeObject("bridge", "Highway Bridge", { x: 0, y: 0, z: 15 }, "#555555", 0.1, 0.9),
      makeObject("trafficlight", "Traffic Light", { x: 5, y: 0, z: 0 }, "#333333", 0.1, 0.4),
      makeObject("streetlight", "Street Light 1", { x: -5, y: 0, z: -5 }, "#fbbf24", 0.1, 0.4),
      makeObject("streetlight", "Street Light 2", { x: 5, y: 0, z: 10 }, "#fbbf24", 0.1, 0.4),
      makeObject("khoem", "KHOEM-AI", { x: -2, y: 0, z: -5 }, "#a0a0a0", 0.9, 0.2),
      makeObject("car", "Audi Car", { x: 2, y: 0, z: 5 }, "#1e3a8a", 0.9, 0.2),
      makeObject("sportcar", "Sports Car", { x: -2, y: 0, z: 10 }, "#dc2626", 0.9, 0.2),
      makeObject("suv", "SUV", { x: 2, y: 0, z: 15 }, "#16a34a", 0.9, 0.2),
      makeObject("pickup", "Pickup Truck", { x: -2, y: 0, z: 20 }, "#d97706", 0.9, 0.2),
      makeObject("van", "Van / MPV", { x: 2, y: 0, z: 25 }, "#64748b", 0.9, 0.2),
      makeObject("police", "Police Car", { x: -2, y: 0, z: 30 }, "#2563eb", 0.9, 0.2),
    ];
  }
  // studio
  return [
    makeObject("car", "Audi Car", { x: 0, y: 0, z: 0 }, "#1e3a8a", 0.9, 0.2),
    makeObject("sportcar", "Sports Car", { x: 0, y: 0, z: 5 }, "#dc2626", 0.9, 0.2),
    makeObject("lamp", "Studio Light 1", { x: -3, y: 0, z: -2 }, "#fbbf24", 0.1, 0.4),
    makeObject("lamp", "Studio Light 2", { x: 3, y: 0, z: -2 }, "#fbbf24", 0.1, 0.4),
  ];
}

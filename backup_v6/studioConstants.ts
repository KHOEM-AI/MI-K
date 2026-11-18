import { Gem, Droplet, TreePine, Box } from "lucide-react";
import type { Shape, Vector3 } from "./studioTypes";

export const presets: { name: string; shape: Shape }[] = [
  { name: "Cube", shape: "box" },
  { name: "Sphere", shape: "sphere" },
  { name: "Cone", shape: "cone" },
  { name: "Cylinder", shape: "cylinder" },
  { name: "Ring", shape: "torus" },
  { name: "Text", shape: "text" },
  { name: "Audi Car", shape: "car" },
  { name: "Sports Car", shape: "sportcar" },
  { name: "Table", shape: "table" },
  { name: "Chair", shape: "chair" },
  { name: "Sofa", shape: "sofa" },
  { name: "Tree", shape: "tree" },
  { name: "House", shape: "house" },
  { name: "Lamp", shape: "lamp" },
  { name: "KHOEM-AI", shape: "khoem" },
  { name: "Dual Highway", shape: "highway" },
  { name: "Bridge", shape: "bridge" },
  { name: "Traffic Light", shape: "trafficlight" },
  { name: "Street Light", shape: "streetlight" },
  { name: "SUV", shape: "suv" },
  { name: "Pickup Truck", shape: "pickup" },
  { name: "Van / MPV", shape: "van" },
  { name: "Police Car", shape: "police" },
  { name: "Palm Tree", shape: "palmtree" },
  { name: "Big Tree", shape: "bigtree" },
  { name: "Bush", shape: "bush" },
  { name: "Flower", shape: "flower" },
  { name: "Bamboo", shape: "bamboo" },
  { name: "Cactus", shape: "cactus" },
  { name: "Pine Tree", shape: "pinetree" },
  { name: "Sunflower", shape: "sunflower" },
  { name: "Lotus", shape: "lotus" },
  { name: "Grass", shape: "grass" },
  { name: "Vine", shape: "vine" },
  { name: "Rock", shape: "rock" },
  { name: "Pond", shape: "pond" },
  { name: "Hill", shape: "hill" },
  { name: "Ground Patch", shape: "groundpatch" },
  { name: "Rose", shape: "rose" },
  { name: "Tulip", shape: "tulip" },
  { name: "Mushroom", shape: "mushroom" },
  { name: "Star", shape: "star" },
  { name: "Moon", shape: "moon" },
  { name: "Cloud", shape: "cloud" },
  { name: "Waterfall", shape: "waterfall" },
  { name: "Lavender", shape: "lavender" },
  { name: "Cattail", shape: "cattail" },
  { name: "Fern", shape: "fern" },
  { name: "Cactus Flower", shape: "cactusflower" },
  { name: "Bonsai", shape: "bonsai" },
  { name: "Volcano", shape: "volcano" },
  { name: "Sand Dune", shape: "sanddune" },
  { name: "Ice", shape: "ice" },
  { name: "Lava Rock", shape: "lavarock" },
  { name: "Cave", shape: "cave" },
];

export const MATERIAL_PRESETS = [
  { name: "Gold", color: "#ffd700", metalness: 1.0, roughness: 0.2, icon: Gem },
  { name: "Silver", color: "#e0e0e0", metalness: 1.0, roughness: 0.3, icon: Gem },
  { name: "Glass", color: "#88ccff", metalness: 0.9, roughness: 0.1, icon: Droplet },
  { name: "Wood", color: "#8b4513", metalness: 0.0, roughness: 0.9, icon: TreePine },
  { name: "Plastic", color: "#ff6b6b", metalness: 0.1, roughness: 0.4, icon: Box },
];

export const zero = (): Vector3 => ({ x: 0, y: 0, z: 0 });
export const one = (): Vector3 => ({ x: 1, y: 1, z: 1 });

export function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

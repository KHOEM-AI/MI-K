export type Shape = "box" | "sphere" | "cone" | "cylinder" | "torus" | "text" | "car" | "sportcar" | "suv" | "pickup" | "van" | "police" | "table" | "chair" | "sofa" | "tree" | "house" | "lamp" | "streetlight" | "khoem" | "highway" | "bridge" | "trafficlight" | "palmtree" | "bigtree" | "bush" | "flower" | "bamboo" | "cactus" | "pinetree" | "sunflower" | "lotus" | "grass" | "vine" | "rock" | "pond" | "hill" | "groundpatch" | "rose" | "tulip" | "mushroom" | "star" | "moon" | "cloud" | "waterfall" | "lavender" | "cattail" | "fern" | "cactusflower" | "bonsai" | "volcano" | "sanddune" | "ice" | "lavarock" | "cave" | "planet" | "satellite" | "spaceship" | "skyscraper" | "castle" | "lamborghini" | "ferrari" | "tesla" | "airplane" | "helicopter" | "boat" | "yacht" | "tiger" | "elephant" | "dragon" | "robot" | "meteor" | "comet" | "ufo" | "lighthouse" | "windmill" | "statue" | "satellitedish" | "telescope" | "fountain" | "bridge2" | "tower" | "pyramid" | "volcano2" | "glacier" | "canyon" | "oasis" | "totem" | "obelisk" | "castle2" | "temple" | "colosseum" | "stadium" | "lighthouse2" | "windmill2" | "airport" | "trainstation" | "skyscraper2" | "windturbine" | "solarpanel" | "satellite2" | "cruiseship" | "submarine" | "hotairballoon" | "helicopter2" | "train" | "bus";
export type Vector3 = { x: number; y: number; z: number };

export type SceneObject = {
  id: string;
  name: string;
  shape: Shape;
  color: string;
  metalness: number;
  roughness: number;
  position: Vector3;
  rotation: Vector3;
  scale: Vector3;
  visible?: boolean;
  locked?: boolean;
  textureData?: string | null;
  glbData?: string | null;
  text?: string;
  groupId?: string;
  groupName?: string;
};

export type StudioAsset = {
  id: string;
  file: File;
  kind: "model";
};

export type Studio3DProps = {
  onAssetSaved?: (asset: StudioAsset) => void;
};

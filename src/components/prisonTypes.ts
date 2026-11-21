export type PrisonIslandVariant = 
  | 'main-island' 
  | 'airport-island' 
  | 'port-island' 
  | 'nature-island';

export interface PrisonIslandConfig {
  id: string;
  name: string;
  type: PrisonIslandVariant;
  position: [number, number, number];
}

export interface TransportConfig {
  type: 'ship' | 'plane';
  start: [number, number, number];
  end: [number, number, number];
}

export interface StudioPreset { id: string; label: string; height: number }
export const STUDIO_MODEL: string;
export const PRESETS: StudioPreset[];
export const DEFAULT_SELECTION: string[];
export function heightScale(current: number, target: number): number;
export function lineupPositions(count: number, spacing?: number): number[];
export function togglePreset(selected: string[], id: string): string[];
export function stageSize(heights: number[], spacing?: number): { halfWidth: number; height: number };
export function fitStageDistance(stage: { halfWidth: number; height: number }, fovDeg: number, aspect: number): number;
export function clipPhase(index: number, duration: number): number;
export function pickDefaultClip(names: string[]): string | null;

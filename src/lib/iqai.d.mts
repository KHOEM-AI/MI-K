export class IqaiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string);
}

export const ASPECTS: Record<string, [number, number]>;
export const MAX_FRAMES: number;

export function clampNumber(v: unknown, lo: number, hi: number, dflt: number): number;

export type StoryBody = {
  scenes: { imageId: string }[];
  secondsPerScene: number;
  width: number;
  height: number;
  transition: string;
  effect: string;
  audioId?: string;
  sfx?: string;
};
export function buildStoryBody(o?: {
  imageIds?: string[];
  secondsPerScene?: number;
  aspect?: string;
  transition?: string;
  effect?: string;
  sfx?: string | null;
  audioId?: string | null;
}): StoryBody;

export function pickRecorderMime(isTypeSupported: (type: string) => boolean): string;
export function findCanvas(root?: Document | null): HTMLCanvasElement | null;
export function grabCanvasPng(canvas: HTMLCanvasElement, raf?: (cb: () => void) => unknown): Promise<Blob>;
export function startRecording(
  canvas: HTMLCanvasElement,
  o?: { seconds?: number; fps?: number; bitsPerSecond?: number; MR?: typeof MediaRecorder },
): { stop(): void; done: Promise<Blob> };

export type IqaiCapabilities = {
  service?: string;
  system?: { ffmpeg?: boolean; khmerFont?: boolean; nativeCpp?: boolean };
  features?: Record<string, { ready: boolean; needs: string[] }>;
  options?: { sfxTypes?: string[]; photoEffects?: string[] };
};
export type IqaiSound = { id: string; name: string; category?: string; tags?: string[] };
export type IqaiMediaItem = { id: string; type?: string; filename?: string };
export type IqaiVideoResult = { blob: Blob; applied: Record<string, unknown> | null };

export type IqaiClient = {
  health(): Promise<boolean>;
  capabilities(): Promise<IqaiCapabilities>;
  videoOptions(): Promise<{ effects: string[]; sfxTypes: string[] }>;
  sounds(q?: string): Promise<IqaiSound[]>;
  soundBlob(id: string): Promise<Blob>;
  uploadMedia(blob: Blob, filename: string, mime?: string): Promise<IqaiMediaItem>;
  deleteMedia(id: string): Promise<unknown>;
  mediaUrl(id: string): string;
  story(body: StoryBody): Promise<IqaiVideoResult>;
  editVideo(
    blob: Blob,
    o?: { trimStart?: number; trimEnd?: number; speed?: number; mute?: boolean; width?: number; height?: number },
  ): Promise<IqaiVideoResult>;
};
export function createIqai(base?: string): IqaiClient;
export const iqai: IqaiClient;

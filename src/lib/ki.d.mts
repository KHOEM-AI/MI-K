export const ki: {
  health(): Promise<{ ok: boolean; service: string }>;
  registry(): Promise<{ version: number; files: string[] }>;
  file(name: string): Promise<any>;
  deviceTypes(): Promise<any>;
  getScans(): Promise<{ scans: any[] }>;
  saveScan(s: { id: string; counts: Record<string, number>; time?: string; name?: string; gps?: any }): Promise<{ ok: true; count: number }>;
  getColors(): Promise<{ palettes: any[] }>;
  savePalette(p: { id: string; cols: string[] }): Promise<{ ok: true; count: number }>;
};

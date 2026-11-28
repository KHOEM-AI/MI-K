const env = (import.meta as any).env || {};
/** Empty = relative, goes through Vite proxy /api/creative → :8788 */
export const API_BASE: string = env.VITE_CREATIVE_API || "";

async function jpost(path: string, body: any) {
  const r = await fetch(API_BASE + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${path} → ${r.status}: ${await r.text()}`);
  return r.json();
}

export const post2d = (prompt: string) =>
  jpost("/api/creative/2d", { prompt }) as Promise<{ imageUrl: string }>;

export const postGlb = (image: string, prompt?: string) =>
  jpost("/api/creative/glb", { image, prompt }) as Promise<{ glbUrl: string }>;

export const postWorld = (prompt: string) =>
  jpost("/api/creative/world", { prompt }) as Promise<any>;

export const abs = (u: string) =>
  !u ? u : u.startsWith("http") || u.startsWith("data:") || u.startsWith("/") ? u : API_BASE + u;

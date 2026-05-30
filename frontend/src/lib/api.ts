const BASE = process.env.NEXT_PUBLIC_API_URL;

export interface HotspotDto {
  hotspotId: string;
  type: "MoveTo" | "Info";
  yaw: number;
  pitch: number;
  nextSceneId?: string;
  tieuDePopup?: string;
  noiDungPopup?: string;
  urlAudio?: string;
}

export interface SceneDto {
  sceneId: string;
  slugDiTich: string;
  baseUrlCDN: string;
  isDefault: boolean;
  tieuDe: string;
  urlAudio?: string;
  hotspots: HotspotDto[];
}

export async function fetchDefaultScene(lang: string): Promise<SceneDto> {
  const res = await fetch(`${BASE}/api/scenes/default?lang=${lang}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch default scene");
  return res.json();
}

export async function fetchScene(id: string, lang: string): Promise<SceneDto> {
  const res = await fetch(`${BASE}/api/scenes/${id}?lang=${lang}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch scene");
  return res.json();
}

export async function fetchAllScenes(lang: string): Promise<SceneDto[]> {
  const res = await fetch(`${BASE}/api/scenes?lang=${lang}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch scenes");
  return res.json();
}

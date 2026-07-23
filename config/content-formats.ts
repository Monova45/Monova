export interface ContentFormat {
  id: string;
  name: string;
  width: number;
  height: number;
  platforms: readonly string[];
}

export const contentFormats: readonly ContentFormat[] = [
  { id: "square", name: "Cuadrado", width: 1080, height: 1080, platforms: ["instagram", "facebook", "linkedin"] },
  { id: "portrait", name: "Vertical", width: 1080, height: 1350, platforms: ["instagram"] },
  { id: "story", name: "Story / Reel", width: 1080, height: 1920, platforms: ["instagram", "facebook", "tiktok"] },
  { id: "landscape", name: "Horizontal", width: 1920, height: 1080, platforms: ["youtube", "web"] },
  { id: "meta-ad", name: "Meta Ad", width: 1200, height: 628, platforms: ["facebook", "instagram"] },
  { id: "linkedin-banner", name: "LinkedIn Banner", width: 1584, height: 396, platforms: ["linkedin"] },
  { id: "youtube-thumbnail", name: "YouTube Thumbnail", width: 1280, height: 720, platforms: ["youtube"] },
];

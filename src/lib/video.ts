export type Video =
  | { tipo: "iframe"; src: string }
  | { tipo: "arquivo"; src: string }
  | { tipo: "link"; src: string };

// Aceita o link como o dono da área copia do provedor: YouTube, Vimeo, Panda Video
// (link de embed) ou arquivo .mp4. Qualquer outro vira um botão "abrir vídeo".
export function resolverVideo(url: string | null | undefined): Video | null {
  if (!url?.trim()) return null;
  let u: URL;
  try {
    u = new URL(url.trim());
  } catch {
    return null;
  }
  if (u.protocol !== "https:") return { tipo: "link", src: u.toString() };
  const host = u.hostname.replace(/^www\./, "");

  if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
    const id = u.searchParams.get("v") ?? u.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]+)/)?.[1];
    if (id) return { tipo: "iframe", src: `https://www.youtube-nocookie.com/embed/${id}` };
  }
  if (host === "youtu.be") {
    const id = u.pathname.slice(1).split("/")[0];
    if (id) return { tipo: "iframe", src: `https://www.youtube-nocookie.com/embed/${id}` };
  }
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const id = u.pathname.match(/(\d{6,})/)?.[1];
    if (id) return { tipo: "iframe", src: `https://player.vimeo.com/video/${id}` };
  }
  if (host.endsWith("pandavideo.com.br")) return { tipo: "iframe", src: u.toString() };
  if (/\.(mp4|webm)$/i.test(u.pathname)) return { tipo: "arquivo", src: u.toString() };
  return { tipo: "link", src: u.toString() };
}

import { ExternalLink } from "lucide-react";
import { resolverVideo } from "@/lib/video";

export function PlayerVideo({ url, titulo }: { url: string | null | undefined; titulo: string }) {
  const video = resolverVideo(url);
  if (!video) {
    return (
      <div className="flex aspect-video w-full items-center justify-center bg-muted text-muted-foreground">
        <div className="text-center">
          <p className="text-4xl">🎬</p>
          <p className="mt-2 text-sm">Vídeo ainda não disponível</p>
        </div>
      </div>
    );
  }
  if (video.tipo === "arquivo") {
    return (
      <video controls src={video.src} className="aspect-video w-full bg-black">
        Seu navegador não suporta vídeo.
      </video>
    );
  }
  if (video.tipo === "link") {
    return (
      <a href={video.src} target="_blank" rel="noopener noreferrer" className="flex aspect-video w-full items-center justify-center gap-2 bg-muted text-sm font-medium hover:bg-muted/70">
        Abrir vídeo <ExternalLink className="size-4" />
      </a>
    );
  }
  return (
    <iframe
      src={video.src}
      title={titulo}
      className="aspect-video w-full border-0 bg-black"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture"
      allowFullScreen
    />
  );
}

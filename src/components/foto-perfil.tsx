"use client";

import { useState } from "react";

export function FotoPerfil({ url, iniciais }: { url?: string | null; iniciais: string }) {
  const [falhou, setFalhou] = useState<string | null>(null);
  return url && falhou !== url ? (
    // URL temporária de um bucket privado; o navegador mantém a sessão de exibição.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="Foto de perfil" className="h-full w-full rounded-full object-cover" onError={() => setFalhou(url)} />
  ) : <>{iniciais}</>;
}

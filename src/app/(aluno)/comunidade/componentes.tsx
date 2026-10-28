"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FotoPerfil } from "@/components/foto-perfil";
import { Badge } from "@/components/ui/badge";
import { formatarRelativo, iniciais } from "@/lib/format";
import { reagir } from "./actions";
import { EMOJIS, type Autor, type Post } from "./types";

export function Cabecalho({ autor, criadoEm, fixado }: { autor: Autor | null; criadoEm: string; fixado?: boolean }) {
  const nome = autor?.nome || "Aluno";
  return (
    <div className="flex items-center gap-2">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
        <FotoPerfil url={autor?.avatar} iniciais={iniciais(nome)} />
      </div>
      <div className="flex min-w-0 flex-wrap items-baseline gap-x-2">
        <span className="truncate text-sm font-medium">{nome}</span>
        {autor?.is_admin && <Badge variant="new">equipe</Badge>}
        <span className="text-xs text-muted-foreground">{formatarRelativo(criadoEm)}</span>
        {fixado && <span className="text-xs" title="Fixado">📌</span>}
      </div>
    </div>
  );
}

export function TextoPost({ texto, completo = false }: { texto: string; completo?: boolean }) {
  const [aberto, setAberto] = useState(false);
  const resumir = !completo && texto.length > 400;
  return (
    <div className="mt-2">
      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground/85">{resumir && !aberto ? `${texto.slice(0, 400)}…` : texto}</p>
      {resumir && (
        <button type="button" aria-expanded={aberto} onClick={() => setAberto(!aberto)} className="mt-2 text-sm font-medium underline">
          {aberto ? "Ver menos" : "Ver mais"}
        </button>
      )}
    </div>
  );
}

export function Reacoes({ post, userId, onErro }: { post: Post; userId: string; onErro: (e: string | null) => void }) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  const grupos = post.reacoes.reduce<Record<string, { total: number; minha: boolean }>>((acc, r) => {
    acc[r.emoji] ??= { total: 0, minha: false };
    acc[r.emoji].total++;
    if (r.user_id === userId) acc[r.emoji].minha = true;
    return acc;
  }, {});
  return (
    <>
      {EMOJIS.map((emoji) => {
        const g = grupos[emoji];
        return (
          <button
            key={emoji}
            type="button"
            disabled={pendente}
            aria-label={`Reagir com ${emoji}`}
            aria-pressed={!!g?.minha}
            onClick={() =>
              iniciar(async () => {
                const r = await reagir(post.id, emoji);
                onErro(r.ok ? null : r.error);
                if (r.ok) router.refresh();
              })
            }
            className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition ${
              g?.minha ? "border-brand bg-brand/10" : "border-transparent hover:border-border hover:bg-muted"
            }`}
          >
            <span>{emoji}</span>
            {g && <span className="font-medium">{g.total}</span>}
          </button>
        );
      })}
    </>
  );
}

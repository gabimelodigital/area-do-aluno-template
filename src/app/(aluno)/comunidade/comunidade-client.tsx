"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { apagar, criarPost, fixar } from "./actions";
import { Cabecalho, Reacoes, TextoPost } from "./componentes";
import { CANAIS, type Canal, type Post } from "./types";

export function ComunidadeClient({ canal, posts, userId, isAdmin }: { canal: Canal; posts: Post[]; userId: string; isAdmin: boolean }) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  const [novoAberto, setNovoAberto] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [corpo, setCorpo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const config = CANAIS.find((c) => c.id === canal)!;
  const podePostar = canal !== "avisos" || isAdmin;

  function publicar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    iniciar(async () => {
      const r = await criarPost({ canal, titulo, corpo });
      if (!r.ok) return setErro(r.error);
      setTitulo("");
      setCorpo("");
      setNovoAberto(false);
      router.refresh();
    });
  }

  function acao(fn: () => Promise<{ ok: boolean; error?: string }>, confirmar?: string) {
    if (confirmar && !confirm(confirmar)) return;
    iniciar(async () => {
      const r = await fn();
      setErro(r.ok ? null : r.error ?? "Erro.");
      if (r.ok) router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-2">
        {CANAIS.map((c) => (
          <Link
            key={c.id}
            href={`/comunidade?canal=${c.id}`}
            aria-current={canal === c.id ? "page" : undefined}
            className={`shrink-0 rounded-lg border px-3 py-2 text-sm transition ${
              canal === c.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-foreground/30"
            }`}
          >
            <span className="mr-1">{c.icone}</span>
            {c.nome}
          </Link>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">Respeite a turma. Sem links, propaganda ou ofensas.</p>
      {erro && !novoAberto && <Alert variant="err">{erro}</Alert>}

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">{config.desc}</p>
        {podePostar && (
          <Button onClick={() => { setErro(null); setNovoAberto(true); }}>+ Novo post</Button>
        )}
      </div>

      {posts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
          {podePostar ? "Nenhum post neste canal ainda. Seja o primeiro." : "Os avisos da equipe aparecem aqui."}
        </div>
      ) : (
        <ul className="space-y-3">
          {posts.map((p) => (
            <li key={p.id} className="rounded-xl border border-border bg-card p-4">
              <Cabecalho autor={p.autor} criadoEm={p.criado_em} fixado={p.fixado} />
              <Link href={`/comunidade/post/${p.id}`} className="mt-2 block font-semibold hover:underline">{p.titulo}</Link>
              <TextoPost texto={p.corpo} completo={p.fixado} />
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Reacoes post={p} userId={userId} onErro={setErro} />
                <Link href={`/comunidade/post/${p.id}`} className="ml-auto text-xs text-muted-foreground hover:underline">
                  {p.total_respostas > 0 ? `${p.total_respostas} ${p.total_respostas === 1 ? "resposta" : "respostas"}` : "Responder"}
                </Link>
                {isAdmin && (
                  <button type="button" disabled={pendente} onClick={() => acao(() => fixar(p.id, !p.fixado))} className="text-xs text-muted-foreground hover:text-foreground">
                    {p.fixado ? "Desafixar" : "Fixar"}
                  </button>
                )}
                {(p.user_id === userId || isAdmin) && (
                  <button type="button" disabled={pendente} onClick={() => acao(() => apagar(p.id, "post"), "Apagar este post?")} className="text-xs text-muted-foreground hover:text-destructive">
                    Apagar
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {novoAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !pendente && setNovoAberto(false)}>
          <form
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="novo-post-titulo"
            onSubmit={publicar}
            className="w-full max-w-lg space-y-4 rounded-xl bg-card p-6 shadow-xl"
          >
            <h2 id="novo-post-titulo" className="text-lg font-semibold">Novo post em {config.nome}</h2>
            <div>
              <label htmlFor="post-titulo" className="rotulo">Título</label>
              <input id="post-titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} required maxLength={200} autoFocus className="inp w-full py-2" />
            </div>
            <div>
              <label htmlFor="post-corpo" className="rotulo">Mensagem</label>
              <textarea id="post-corpo" value={corpo} onChange={(e) => setCorpo(e.target.value)} required maxLength={10000} rows={6} className="inp w-full py-2" />
            </div>
            {erro && <Alert variant="err">{erro}</Alert>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => !pendente && setNovoAberto(false)}>Cancelar</Button>
              <Button type="submit" disabled={pendente || !titulo.trim() || !corpo.trim()}>{pendente ? "Enviando..." : "Publicar"}</Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { apagar, responder } from "../../actions";
import { Cabecalho, Reacoes, TextoPost } from "../../componentes";
import type { Post, Resposta } from "../../types";

export function PostDetalhe({ post, respostas, userId, isAdmin }: { post: Post; respostas: Resposta[]; userId: string; isAdmin: boolean }) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [texto, setTexto] = useState("");

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!texto.trim()) return;
    iniciar(async () => {
      const r = await responder(post.id, texto);
      if (!r.ok) return setErro(r.error);
      setErro(null);
      setTexto("");
      router.refresh();
    });
  }

  function remover(id: string, tipo: "post" | "resposta") {
    if (!confirm(tipo === "post" ? "Apagar este post e todas as respostas?" : "Apagar esta resposta?")) return;
    iniciar(async () => {
      const r = await apagar(id, tipo);
      if (!r.ok) return setErro(r.error);
      if (tipo === "post") router.push(`/comunidade?canal=${post.canal}`);
      else router.refresh();
    });
  }

  return (
    <div className="mt-4 space-y-4">
      {erro && <Alert variant="err">{erro}</Alert>}
      <article className="rounded-xl border border-border bg-card p-5">
        <Cabecalho autor={post.autor} criadoEm={post.criado_em} fixado={post.fixado} />
        <h1 className="mt-3 text-xl font-bold">{post.titulo}</h1>
        <TextoPost texto={post.corpo} completo />
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Reacoes post={post} userId={userId} onErro={setErro} />
          {(post.user_id === userId || isAdmin) && (
            <button type="button" disabled={pendente} onClick={() => remover(post.id, "post")} className="ml-auto text-xs text-muted-foreground hover:text-destructive">
              Apagar post
            </button>
          )}
        </div>
      </article>

      <h2 className="text-sm font-medium text-muted-foreground">
        {respostas.length} {respostas.length === 1 ? "resposta" : "respostas"}
      </h2>
      {respostas.map((r) => (
        <div key={r.id} className="rounded-xl border border-border bg-card p-4">
          <Cabecalho autor={r.autor} criadoEm={r.criado_em} />
          <TextoPost texto={r.corpo} completo />
          {(r.user_id === userId || isAdmin) && (
            <button type="button" disabled={pendente} onClick={() => remover(r.id, "resposta")} className="mt-2 text-xs text-muted-foreground hover:text-destructive">
              Apagar resposta
            </button>
          )}
        </div>
      ))}

      <form onSubmit={enviar} className="rounded-xl border border-border bg-card p-4">
        <label htmlFor="resposta" className="rotulo">Responder</label>
        <textarea id="resposta" required maxLength={10000} value={texto} onChange={(e) => setTexto(e.target.value)} rows={3} placeholder="Escreva aqui..." className="inp w-full py-2" />
        <div className="mt-3 flex justify-end">
          <Button type="submit" disabled={pendente || !texto.trim()}>{pendente ? "Enviando..." : "Responder"}</Button>
        </div>
      </form>
    </div>
  );
}

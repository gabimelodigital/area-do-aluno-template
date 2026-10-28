"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowUp, Loader2, SquarePen } from "lucide-react";
import { perguntarBia, type FonteBia, type TurnoBia } from "./actions";
import { RespostaFormatada } from "./resposta-formatada";

type Mensagem = TurnoBia & { fontes?: FonteBia[] };

// A conversa vive só no navegador; "Nova conversa" limpa tudo.
export function BiaChat({ sugestoes }: { sugestoes: string[] }) {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [entrada, setEntrada] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [pensando, iniciar] = useTransition();
  const fim = useRef<HTMLDivElement>(null);

  function enviar(valor: string) {
    const pergunta = valor.trim();
    if (pergunta.length < 3 || pensando) return;
    const historico = mensagens.map(({ papel, texto }) => ({ papel, texto }));
    setMensagens((atuais) => [...atuais, { papel: "aluno", texto: pergunta }]);
    setEntrada("");
    setErro(null);
    iniciar(async () => {
      const r = await perguntarBia(pergunta, historico);
      if (r.ok) {
        setMensagens((atuais) => [...atuais, { papel: "bia", texto: r.resposta, fontes: r.fontes }]);
      } else {
        setMensagens((atuais) => atuais.slice(0, -1));
        setEntrada(pergunta);
        setErro(r.error);
      }
      setTimeout(() => fim.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 50);
    });
  }

  return (
    <section aria-label="Conversa com a BIA" className="mt-6 rounded-xl border border-border bg-card p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3 border-b border-border pb-4">
        <p className="text-sm font-semibold">Sua conversa</p>
        {mensagens.length > 0 && (
          <button type="button" disabled={pensando} onClick={() => { setMensagens([]); setEntrada(""); setErro(null); }} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50">
            <SquarePen className="size-3.5" /> Nova conversa
          </button>
        )}
      </div>

      <div aria-live="polite" className="max-h-[55vh] min-h-44 space-y-4 overflow-y-auto py-5">
        {mensagens.length === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Qual é a sua dúvida?{sugestoes.length > 0 && " Você pode começar por aqui:"}</p>
            <div className="flex flex-wrap gap-2">
              {sugestoes.map((s) => (
                <button key={s} type="button" disabled={pensando} onClick={() => enviar(s)} className="rounded-full border border-border bg-muted px-3 py-1.5 text-left text-xs hover:border-brand disabled:opacity-50">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {mensagens.map((m, i) =>
          m.papel === "aluno" ? (
            <div key={i} className="flex justify-end">
              <p className="max-w-[88%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">{m.texto}</p>
            </div>
          ) : (
            <div key={i} className="flex gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-brand-foreground">B</div>
              <div className="min-w-0 max-w-[90%] rounded-xl bg-muted px-4 py-3">
                <RespostaFormatada texto={m.texto} />
                {!!m.fontes?.length && (
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
                    {m.fontes.map((f) =>
                      f.url ? (
                        <Link key={f.titulo} href={f.url} className="rounded-md border border-border bg-card px-2.5 py-1.5 text-xs hover:border-brand">📖 {f.titulo}</Link>
                      ) : (
                        <span key={f.titulo} className="rounded-md border border-border bg-card px-2.5 py-1.5 text-xs">📄 {f.titulo}</span>
                      ),
                    )}
                  </div>
                )}
              </div>
            </div>
          ),
        )}
        {pensando && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Buscando nas aulas...</p>}
        {erro && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{erro}</p>}
        <div ref={fim} />
      </div>

      <form onSubmit={(e) => { e.preventDefault(); enviar(entrada); }} className="flex items-center gap-2 border-t border-border pt-4">
        <label htmlFor="pergunta-bia" className="sr-only">Escreva sua dúvida</label>
        <input id="pergunta-bia" value={entrada} onChange={(e) => setEntrada(e.target.value)} maxLength={600} placeholder="Escreva sua dúvida sobre as aulas..." className="inp min-w-0 flex-1 py-2.5" />
        <button type="submit" disabled={pensando || entrada.trim().length < 3} aria-label="Enviar pergunta" className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40">
          <ArrowUp className="size-4" />
        </button>
      </form>
    </section>
  );
}

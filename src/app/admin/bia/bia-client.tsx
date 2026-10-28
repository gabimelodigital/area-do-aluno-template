"use client";

import { useState, useTransition } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { apagarTexto, reindexarAulas, salvarTexto } from "./actions";

type Msg = { ok: boolean; texto: string } | null;

export function TextoForm({ texto }: { texto?: { id: string; titulo: string; texto: string } }) {
  const [pendente, iniciar] = useTransition();
  const [msg, setMsg] = useState<Msg>(null);
  const [titulo, setTitulo] = useState(texto?.titulo ?? "");
  const [corpo, setCorpo] = useState(texto?.texto ?? "");
  const prefixo = texto?.id ?? "novo";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        iniciar(async () => {
          const r = await salvarTexto({ id: texto?.id, titulo, texto: corpo });
          setMsg(r.ok ? { ok: true, texto: r.msg ?? "Salvo." } : { ok: false, texto: r.error });
          if (r.ok && !texto) {
            setTitulo("");
            setCorpo("");
          }
        });
      }}
      className="space-y-3"
    >
      <div>
        <label htmlFor={`${prefixo}-titulo`} className="rotulo">Título</label>
        <input id={`${prefixo}-titulo`} required maxLength={200} value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Perguntas frequentes" className="inp w-full py-2" />
      </div>
      <div>
        <label htmlFor={`${prefixo}-texto`} className="rotulo">Conteúdo</label>
        <textarea id={`${prefixo}-texto`} required rows={6} maxLength={200000} value={corpo} onChange={(e) => setCorpo(e.target.value)} className="inp w-full py-2 text-xs" />
      </div>
      {msg && <Alert variant={msg.ok ? "ok" : "err"}>{msg.texto}</Alert>}
      <div className="flex gap-2">
        <Button type="submit" disabled={pendente || !titulo.trim() || !corpo.trim()}>{pendente ? "Salvando..." : "Salvar"}</Button>
        {texto && (
          <Button
            type="button"
            variant="destructive"
            disabled={pendente}
            onClick={() => {
              if (!confirm("Apagar este texto da base da BIA?")) return;
              iniciar(async () => {
                const r = await apagarTexto(texto.id);
                if (!r.ok) setMsg({ ok: false, texto: r.error });
              });
            }}
          >
            Apagar
          </Button>
        )}
      </div>
    </form>
  );
}

export function BotaoReindexar() {
  const [pendente, iniciar] = useTransition();
  const [msg, setMsg] = useState<Msg>(null);
  return (
    <div className="flex flex-col items-end gap-2">
      <Button variant="outline" size="lg" disabled={pendente} onClick={() => iniciar(async () => { const r = await reindexarAulas(); setMsg(r.ok ? { ok: true, texto: r.msg ?? "Pronto." } : { ok: false, texto: r.error }); })}>
        {pendente ? "Reindexando..." : "Reindexar todas"}
      </Button>
      {msg && <p className={`text-xs ${msg.ok ? "text-muted-foreground" : "text-destructive"}`}>{msg.texto}</p>}
    </div>
  );
}

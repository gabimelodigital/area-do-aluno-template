"use client";

import { useState, useTransition } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { liberarAluno, revogarAluno } from "./actions";

export function LiberarAcessoForm() {
  const [pendente, iniciar] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);
  const [form, setForm] = useState({ email: "", nome: "", dias: "" });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        iniciar(async () => {
          const r = await liberarAluno(form);
          setMsg(r.ok ? { ok: true, texto: r.msg ?? "Pronto." } : { ok: false, texto: r.error });
          if (r.ok) setForm({ email: "", nome: "", dias: "" });
        });
      }}
      className="cartao space-y-3 p-5"
    >
      <h2 className="font-semibold">Liberar acesso manual</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="lib-email" className="rotulo">E-mail</label>
          <input id="lib-email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="inp w-full py-2" />
        </div>
        <div>
          <label htmlFor="lib-nome" className="rotulo">Nome (opcional)</label>
          <input id="lib-nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className="inp w-full py-2" />
        </div>
        <div>
          <label htmlFor="lib-dias" className="rotulo">Dias de acesso</label>
          <input id="lib-dias" inputMode="numeric" placeholder="vazio = vitalício" value={form.dias} onChange={(e) => setForm({ ...form, dias: e.target.value })} className="inp w-full py-2" />
        </div>
      </div>
      {msg && <Alert variant={msg.ok ? "ok" : "err"}>{msg.texto}</Alert>}
      <Button type="submit" disabled={pendente || !form.email.trim()}>{pendente ? "Liberando..." : "Liberar acesso"}</Button>
    </form>
  );
}

export function BotaoRevogar({ userId, email }: { userId: string; email: string }) {
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  return (
    <>
      <button
        type="button"
        disabled={pendente}
        onClick={() => {
          if (!confirm(`Bloquear o acesso de ${email}? Ele perde o acesso na hora.`)) return;
          iniciar(async () => {
            const r = await revogarAluno(userId);
            setErro(r.ok ? null : r.error);
          });
        }}
        className="text-xs text-muted-foreground underline hover:text-destructive"
      >
        {pendente ? "Bloqueando..." : "Bloquear"}
      </button>
      {erro && <p className="text-xs text-destructive">{erro}</p>}
    </>
  );
}

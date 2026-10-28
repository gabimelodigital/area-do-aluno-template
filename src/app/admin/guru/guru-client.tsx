"use client";

import { useState, useTransition } from "react";
import { Check, Copy } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { alternarProduto, apagarProduto, reprocessarEvento, salvarProduto } from "./actions";

export function CopiarTexto({ texto }: { texto: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <div className="flex gap-2">
      <code className="min-w-0 flex-1 truncate rounded-md border border-border bg-muted px-3 py-2 text-xs">{texto}</code>
      <Button
        type="button"
        variant="outline"
        size="lg"
        onClick={async () => {
          await navigator.clipboard.writeText(texto);
          setCopiado(true);
          setTimeout(() => setCopiado(false), 2000);
        }}
      >
        {copiado ? <Check /> : <Copy />} {copiado ? "Copiado" : "Copiar"}
      </Button>
    </div>
  );
}

export function ProdutoForm() {
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [form, setForm] = useState({ produto_id: "", nome: "", dias: "" });
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        iniciar(async () => {
          const r = await salvarProduto(form);
          setErro(r.ok ? null : r.error);
          if (r.ok) setForm({ produto_id: "", nome: "", dias: "" });
        });
      }}
      className="space-y-3 rounded-lg bg-muted/50 p-4"
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="prod-id" className="rotulo">ID do produto na Guru</label>
          <input id="prod-id" required value={form.produto_id} onChange={(e) => setForm({ ...form, produto_id: e.target.value })} className="inp w-full py-2 font-mono" />
        </div>
        <div>
          <label htmlFor="prod-nome" className="rotulo">Nome (para você reconhecer)</label>
          <input id="prod-nome" required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className="inp w-full py-2" />
        </div>
        <div>
          <label htmlFor="prod-dias" className="rotulo">Dias de acesso</label>
          <input id="prod-dias" inputMode="numeric" placeholder="vazio = vitalício" value={form.dias} onChange={(e) => setForm({ ...form, dias: e.target.value })} className="inp w-full py-2" />
        </div>
      </div>
      {erro && <Alert variant="err">{erro}</Alert>}
      <Button type="submit" disabled={pendente}>{pendente ? "Salvando..." : "Adicionar produto"}</Button>
    </form>
  );
}

export function AcoesProduto({ id, ativo }: { id: string; ativo: boolean }) {
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  return (
    <div className="flex items-center gap-3 text-xs">
      <button type="button" disabled={pendente} className="underline" onClick={() => iniciar(async () => { const r = await alternarProduto(id, !ativo); setErro(r.ok ? null : r.error); })}>
        {ativo ? "Pausar" : "Reativar"}
      </button>
      <button
        type="button"
        disabled={pendente}
        className="text-muted-foreground underline hover:text-destructive"
        onClick={() => {
          if (!confirm("Remover este produto? Quem já comprou continua com acesso.")) return;
          iniciar(async () => { const r = await apagarProduto(id); setErro(r.ok ? null : r.error); });
        }}
      >
        Remover
      </button>
      {erro && <span className="text-destructive">{erro}</span>}
    </div>
  );
}

export function BotaoReprocessar({ id }: { id: string }) {
  const [pendente, iniciar] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <span className="flex items-center gap-2 text-xs">
      {msg && <span className="text-muted-foreground">{msg}</span>}
      <button type="button" disabled={pendente} className="underline" onClick={() => iniciar(async () => { const r = await reprocessarEvento(id); setMsg(r.ok ? r.msg ?? "ok" : r.error); })}>
        {pendente ? "Reprocessando..." : "Reprocessar"}
      </button>
    </span>
  );
}

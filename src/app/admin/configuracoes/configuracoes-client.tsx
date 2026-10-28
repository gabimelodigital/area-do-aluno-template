"use client";

import { useState, useTransition } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { Configuracoes } from "@/lib/configuracoes";
import { salvarConfiguracoes } from "./actions";

export function ConfiguracoesForm({ inicial }: { inicial: Configuracoes }) {
  const [pendente, iniciar] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);
  const [c, setC] = useState(inicial);
  const campo = (k: keyof Configuracoes) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setC({ ...c, [k]: e.target.value });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        iniciar(async () => {
          const r = await salvarConfiguracoes(c);
          setMsg(r.ok ? { ok: true, texto: r.msg ?? "Salvo." } : { ok: false, texto: r.error });
        });
      }}
      className="space-y-6"
    >
      <section className="cartao space-y-3 p-5">
        <h2 className="font-semibold">Geral</h2>
        <div>
          <label htmlFor="nome-area" className="rotulo">Nome da área</label>
          <input id="nome-area" required maxLength={80} value={c.nome_area} onChange={campo("nome_area")} className="inp w-full py-2" />
          <p className="mt-1 text-xs text-muted-foreground">Aparece na tela de login e no topo da área.</p>
        </div>
      </section>

      <section className="cartao space-y-3 p-5">
        <h2 className="font-semibold">Chamar no WhatsApp</h2>
        <div>
          <label htmlFor="wpp-numero" className="rotulo">Número (com DDI e DDD)</label>
          <input id="wpp-numero" inputMode="tel" placeholder="5511999998888" value={c.whatsapp_numero ?? ""} onChange={campo("whatsapp_numero")} className="inp w-full py-2" />
          <p className="mt-1 text-xs text-muted-foreground">Vazio = o botão de WhatsApp some.</p>
        </div>
        <div>
          <label htmlFor="wpp-msg" className="rotulo">Mensagem que já vem escrita</label>
          <input id="wpp-msg" maxLength={300} value={c.whatsapp_mensagem} onChange={campo("whatsapp_mensagem")} className="inp w-full py-2" />
        </div>
      </section>

      <section className="cartao space-y-3 p-5">
        <h2 className="font-semibold">Comece Aqui</h2>
        <div>
          <label htmlFor="comece-titulo" className="rotulo">Título</label>
          <input id="comece-titulo" maxLength={120} value={c.comece_titulo} onChange={campo("comece_titulo")} className="inp w-full py-2" />
        </div>
        <div>
          <label htmlFor="comece-texto" className="rotulo">Texto de boas-vindas</label>
          <textarea id="comece-texto" rows={3} maxLength={600} value={c.comece_texto} onChange={campo("comece_texto")} className="inp w-full py-2" />
        </div>
        <div>
          <label htmlFor="comece-video" className="rotulo">Link do vídeo de boas-vindas</label>
          <input id="comece-video" type="url" placeholder="https://..." value={c.comece_video_url ?? ""} onChange={campo("comece_video_url")} className="inp w-full py-2" />
          <p className="mt-1 text-xs text-muted-foreground">YouTube, Vimeo, Panda Video (link de embed) ou .mp4.</p>
        </div>
      </section>

      <section className="cartao space-y-3 p-5">
        <h2 className="font-semibold">BIA</h2>
        <div>
          <label htmlFor="bia-cota" className="rotulo">Perguntas por aluno, por mês</label>
          <input id="bia-cota" type="number" min={0} max={10000} value={c.bia_cota_mensal} onChange={(e) => setC({ ...c, bia_cota_mensal: Number(e.target.value) })} className="inp w-32 py-2" />
          <p className="mt-1 text-xs text-muted-foreground">0 = BIA desligada para alunos. Admin não tem limite.</p>
        </div>
      </section>

      {msg && <Alert variant={msg.ok ? "ok" : "err"}>{msg.texto}</Alert>}
      <Button type="submit" size="lg" disabled={pendente}>{pendente ? "Salvando..." : "Salvar configurações"}</Button>
    </form>
  );
}

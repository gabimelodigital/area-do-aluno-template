"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { Aula, Modulo } from "@/lib/curso";
import { apagarAula, apagarModulo, criarAula, salvarAula, salvarModulo } from "./actions";

type Msg = { ok: boolean; texto: string } | null;

function Publicado({ valor, onChange }: { valor: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={valor} onChange={(e) => onChange(e.target.checked)} className="size-4 accent-[var(--brand)]" />
      Publicado (visível para os alunos)
    </label>
  );
}

export function ModuloForm({ modulo }: { modulo?: Modulo }) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  const [msg, setMsg] = useState<Msg>(null);
  const [form, setForm] = useState({ titulo: modulo?.titulo ?? "", descricao: modulo?.descricao ?? "", ordem: modulo?.ordem ?? 0, publicado: modulo?.publicado ?? false });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        iniciar(async () => {
          const r = await salvarModulo({ id: modulo?.id, ...form });
          if (!r.ok) return setMsg({ ok: false, texto: r.error });
          if (!modulo && r.id) return router.push(`/admin/curso/${r.id}`);
          setMsg({ ok: true, texto: "Módulo salvo." });
          router.refresh();
        });
      }}
      className="space-y-3"
    >
      <div>
        <label htmlFor="mod-titulo" className="rotulo">Título</label>
        <input id="mod-titulo" required maxLength={200} value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} className="inp w-full py-2" />
      </div>
      <div>
        <label htmlFor="mod-desc" className="rotulo">Descrição (opcional)</label>
        <textarea id="mod-desc" maxLength={1000} rows={2} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} className="inp w-full py-2" />
      </div>
      {modulo && (
        <div className="flex flex-wrap items-end gap-6">
          <div>
            <label htmlFor="mod-ordem" className="rotulo">Ordem</label>
            <input id="mod-ordem" type="number" value={form.ordem} onChange={(e) => setForm({ ...form, ordem: Number(e.target.value) })} className="inp w-24 py-2" />
          </div>
          <Publicado valor={form.publicado} onChange={(publicado) => setForm({ ...form, publicado })} />
        </div>
      )}
      {msg && <Alert variant={msg.ok ? "ok" : "err"}>{msg.texto}</Alert>}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pendente || !form.titulo.trim()}>{pendente ? "Salvando..." : modulo ? "Salvar módulo" : "Criar módulo"}</Button>
        {modulo && (
          <Button
            type="button"
            variant="destructive"
            disabled={pendente}
            onClick={() => {
              if (!confirm("Apagar este módulo e TODAS as aulas dele? Não dá para desfazer.")) return;
              iniciar(async () => {
                const r = await apagarModulo(modulo.id);
                if (!r.ok) return setMsg({ ok: false, texto: r.error });
                router.push("/admin/curso");
              });
            }}
          >
            Apagar módulo
          </Button>
        )}
      </div>
    </form>
  );
}

export function NovaAulaForm({ moduloId }: { moduloId: string }) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  const [titulo, setTitulo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        iniciar(async () => {
          const r = await criarAula(moduloId, titulo);
          if (!r.ok) return setErro(r.error);
          router.push(`/admin/curso/${moduloId}/aula/${r.id}`);
        });
      }}
      className="flex flex-wrap gap-2"
    >
      <label htmlFor="nova-aula" className="sr-only">Título da nova aula</label>
      <input id="nova-aula" required maxLength={200} placeholder="Título da nova aula" value={titulo} onChange={(e) => setTitulo(e.target.value)} className="inp min-w-0 flex-1 py-2" />
      <Button type="submit" size="lg" disabled={pendente || !titulo.trim()}>{pendente ? "Criando..." : "Adicionar aula"}</Button>
      {erro && <p className="w-full text-sm text-destructive">{erro}</p>}
    </form>
  );
}

export function AulaForm({ aula }: { aula: Aula }) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  const [msg, setMsg] = useState<Msg>(null);
  const [form, setForm] = useState({
    titulo: aula.titulo,
    descricao: aula.descricao ?? "",
    video_url: aula.video_url ?? "",
    materiais: aula.materiais.map((m) => `${m.label} | ${m.url}`).join("\n"),
    transcricao: aula.transcricao ?? "",
    ordem: aula.ordem,
    publicado: aula.publicado,
  });
  const campo = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        iniciar(async () => {
          const r = await salvarAula({ id: aula.id, ...form, ordem: Number(form.ordem) });
          setMsg(r.ok ? { ok: true, texto: r.msg ?? "Aula salva." } : { ok: false, texto: r.error });
          if (r.ok) router.refresh();
        });
      }}
      className="space-y-4"
    >
      <div>
        <label htmlFor="aula-titulo" className="rotulo">Título</label>
        <input id="aula-titulo" required maxLength={200} value={form.titulo} onChange={campo("titulo")} className="inp w-full py-2" />
      </div>
      <div>
        <label htmlFor="aula-video" className="rotulo">Link do vídeo</label>
        <input id="aula-video" type="url" placeholder="https://..." value={form.video_url} onChange={campo("video_url")} className="inp w-full py-2" />
        <p className="mt-1 text-xs text-muted-foreground">Aceita YouTube, Vimeo, Panda Video (link de embed) ou arquivo .mp4.</p>
      </div>
      <div>
        <label htmlFor="aula-desc" className="rotulo">Descrição (opcional)</label>
        <textarea id="aula-desc" rows={3} maxLength={2000} value={form.descricao} onChange={campo("descricao")} className="inp w-full py-2" />
      </div>
      <div>
        <label htmlFor="aula-materiais" className="rotulo">Materiais (opcional)</label>
        <textarea id="aula-materiais" rows={3} placeholder={"Apostila da aula | https://link-do-pdf\nPlanilha | https://link"} value={form.materiais} onChange={campo("materiais")} className="inp w-full py-2 font-mono text-xs" />
        <p className="mt-1 text-xs text-muted-foreground">Um por linha: Nome | link. Pode ser link do Google Drive, Supabase Storage etc.</p>
      </div>
      <div>
        <label htmlFor="aula-transcricao" className="rotulo">Transcrição da aula (alimenta a BIA)</label>
        <textarea id="aula-transcricao" rows={8} maxLength={200000} value={form.transcricao} onChange={campo("transcricao")} className="inp w-full py-2 text-xs" placeholder="Cole aqui o texto falado na aula. A BIA responde aos alunos com base nele." />
        <p className="mt-1 text-xs text-muted-foreground">Sem transcrição, a BIA não sabe o conteúdo desta aula. {form.transcricao.length.toLocaleString("pt-BR")} caracteres.</p>
      </div>
      <div className="flex flex-wrap items-end gap-6">
        <div>
          <label htmlFor="aula-ordem" className="rotulo">Ordem</label>
          <input id="aula-ordem" type="number" value={form.ordem} onChange={(e) => setForm({ ...form, ordem: Number(e.target.value) })} className="inp w-24 py-2" />
        </div>
        <Publicado valor={form.publicado} onChange={(publicado) => setForm({ ...form, publicado })} />
      </div>
      {msg && <Alert variant={msg.ok ? "ok" : "err"}>{msg.texto}</Alert>}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="lg" disabled={pendente || !form.titulo.trim()}>{pendente ? "Salvando..." : "Salvar aula"}</Button>
        <Button
          type="button"
          size="lg"
          variant="destructive"
          disabled={pendente}
          onClick={() => {
            if (!confirm("Apagar esta aula? Não dá para desfazer.")) return;
            iniciar(async () => {
              const r = await apagarAula(aula.id);
              if (!r.ok) return setMsg({ ok: false, texto: r.error });
              router.push(`/admin/curso/${aula.modulo_id}`);
            });
          }}
        >
          Apagar aula
        </Button>
      </div>
    </form>
  );
}

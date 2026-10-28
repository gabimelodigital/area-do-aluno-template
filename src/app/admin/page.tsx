import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { lerConfiguracoes } from "@/lib/configuracoes";
import { biaConfigurada } from "@/lib/bia/config";
import { formatarDataHora } from "@/lib/format";
import { Indicador, SeloResultado, TituloAdmin } from "@/components/admin/ui";

export const metadata = { title: "Admin" };

export default async function AdminPage() {
  const supabase = await createClient();
  const [{ data: alunos }, { data: eventos }, { count: modulos }, { count: produtos }, config] = await Promise.all([
    supabase.rpc("admin_listar_alunos", { p_busca: null }),
    supabase.from("guru_eventos").select("id, email, status, resultado, criado_em").order("criado_em", { ascending: false }).limit(5),
    supabase.from("modulos").select("id", { count: "exact", head: true }).eq("publicado", true),
    supabase.from("guru_produtos").select("id", { count: "exact", head: true }).eq("ativo", true),
    lerConfiguracoes(supabase),
  ]);
  const lista = (alunos ?? []) as { acesso_ativo: boolean; is_admin: boolean }[];
  const ativos = lista.filter((a) => a.acesso_ativo && !a.is_admin).length;

  // Checklist de instalação: some quando tudo estiver configurado.
  const checklist = [
    { feito: !!process.env.SUPABASE_SERVICE_ROLE_KEY, texto: "Variável SUPABASE_SERVICE_ROLE_KEY configurada", href: null },
    { feito: !!process.env.GURU_API_TOKEN && !!process.env.SENHA_PADRAO_ALUNO, texto: "GURU_API_TOKEN e SENHA_PADRAO_ALUNO configuradas", href: null },
    { feito: (produtos ?? 0) > 0, texto: "Produto da Guru cadastrado", href: "/admin/guru" },
    { feito: !!config.whatsapp_numero && !!config.comece_video_url, texto: "WhatsApp e vídeo do Comece Aqui preenchidos", href: "/admin/configuracoes" },
    { feito: (modulos ?? 0) > 0, texto: "Pelo menos um módulo publicado", href: "/admin/curso" },
    { feito: biaConfigurada(), texto: "Chave da BIA (ANTHROPIC_API_KEY) configurada", href: "/admin/bia" },
  ];
  const pendentes = checklist.filter((c) => !c.feito).length;

  return (
    <>
      <TituloAdmin titulo="Painel" descricao="Visão geral da sua área de membros." />
      <div className="grid gap-3 sm:grid-cols-3">
        <Indicador rotulo="Alunos com acesso" valor={ativos} />
        <Indicador rotulo="Contas cadastradas" valor={lista.length} detalhe={lista.length >= 200 ? "mostrando as 200 mais recentes" : undefined} />
        <Indicador rotulo="Módulos publicados" valor={modulos ?? 0} />
      </div>

      {pendentes > 0 && (
        <section className="cartao mt-6 p-5">
          <h2 className="font-semibold">Falta pouco para abrir as portas</h2>
          <ul className="mt-3 space-y-2">
            {checklist.map((c) => (
              <li key={c.texto} className="flex items-center gap-2 text-sm">
                {c.feito ? <CheckCircle2 className="size-4 text-success" /> : <Circle className="size-4 text-muted-foreground" />}
                {c.href && !c.feito ? <Link href={c.href} className="underline">{c.texto}</Link> : <span className={c.feito ? "text-muted-foreground" : ""}>{c.texto}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="cartao mt-6 p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Últimos eventos da Guru</h2>
          <Link href="/admin/guru" className="text-sm underline">Ver todos</Link>
        </div>
        {!eventos?.length ? (
          <p className="mt-3 text-sm text-muted-foreground">Nenhuma venda recebida ainda.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {eventos.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <span className="min-w-0 truncate">{e.email} · {e.status}</span>
                <span className="flex items-center gap-2 text-xs text-muted-foreground">{formatarDataHora(e.criado_em)} <SeloResultado resultado={e.resultado} /></span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { formatarDataHora } from "@/lib/format";
import { Alert } from "@/components/ui/alert";
import { SeloResultado, TituloAdmin } from "@/components/admin/ui";
import { BotaoReprocessar, CopiarTexto, ProdutoForm, AcoesProduto } from "./guru-client";

export const metadata = { title: "Guru" };

export default async function GuruAdminPage({ searchParams }: { searchParams: Promise<{ filtro?: string }> }) {
  const { filtro } = await searchParams;
  const supabase = await createClient();
  let consulta = supabase.from("guru_eventos").select("id, email, status, resultado, detalhe, referencia, criado_em").order("criado_em", { ascending: false }).limit(50);
  if (filtro === "erro" || filtro === "ignorado") consulta = consulta.eq("resultado", filtro);
  const [{ data: produtos }, { data: eventos }] = await Promise.all([
    supabase.from("guru_produtos").select("id, produto_id, nome, dias_acesso, ativo").order("criado_em"),
    consulta,
  ]);
  const h = await headers();
  const urlWebhook = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("x-forwarded-host") ?? h.get("host")}/api/webhooks/guru`;
  const tokenOk = !!process.env.GURU_API_TOKEN && !!process.env.SENHA_PADRAO_ALUNO && !!process.env.SUPABASE_SERVICE_ROLE_KEY;

  return (
    <>
      <TituloAdmin titulo="Guru" descricao="Cada venda aprovada cria o aluno (com a senha padrão) e libera o acesso. Reembolso, chargeback e disputa bloqueiam na hora." />

      {!tokenOk && (
        <Alert variant="warn" className="mb-6">
          Faltam variáveis no servidor: confira GURU_API_TOKEN, SENHA_PADRAO_ALUNO e SUPABASE_SERVICE_ROLE_KEY (INSTALACAO.md, passo 4).
        </Alert>
      )}

      <section className="cartao space-y-2 p-5">
        <h2 className="font-semibold">1. URL do webhook</h2>
        <p className="text-sm text-muted-foreground">Na Guru: Configurações → Webhooks → Novo webhook. Cole esta URL e marque os eventos de venda (transações).</p>
        <CopiarTexto texto={urlWebhook} />
      </section>

      <section className="cartao mt-4 space-y-4 p-5">
        <div>
          <h2 className="font-semibold">2. Produtos que liberam acesso</h2>
          <p className="text-sm text-muted-foreground">Use o ID do produto que aparece na Guru. Vendas de produtos fora desta lista são ignoradas (ficam no log).</p>
        </div>
        {!!produtos?.length && (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {produtos.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                <div className="min-w-0 flex-1">
                  <p className={p.ativo ? "font-medium" : "font-medium text-muted-foreground line-through"}>{p.nome}</p>
                  <p className="font-mono text-xs text-muted-foreground">{p.produto_id} · {p.dias_acesso ? `${p.dias_acesso} dias de acesso` : "vitalício"}</p>
                </div>
                <AcoesProduto id={p.id} ativo={p.ativo} />
              </li>
            ))}
          </ul>
        )}
        <ProdutoForm />
      </section>

      <section className="cartao mt-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">3. Vendas recebidas</h2>
          <nav className="flex gap-3 text-sm">
            <a href="/admin/guru" className={!filtro ? "font-semibold underline" : "underline"}>Todas</a>
            <a href="/admin/guru?filtro=erro" className={filtro === "erro" ? "font-semibold underline" : "underline"}>Com erro</a>
            <a href="/admin/guru?filtro=ignorado" className={filtro === "ignorado" ? "font-semibold underline" : "underline"}>Ignoradas</a>
          </nav>
        </div>
        {!eventos?.length ? (
          <p className="mt-3 text-sm text-muted-foreground">Nenhum evento. Faça uma venda de teste na Guru para conferir.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {eventos.map((e) => (
              <li key={e.id} className="py-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="min-w-0 truncate font-medium">{e.email}</span>
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    {e.status} · {formatarDataHora(e.criado_em)} <SeloResultado resultado={e.resultado} />
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">{e.detalhe ?? "—"} <span className="font-mono">· {e.referencia}</span></p>
                  {e.resultado !== "processado" && <BotaoReprocessar id={e.id} />}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

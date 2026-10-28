import { createClient } from "@/lib/supabase/server";
import { BIA_MODELO, biaConfigurada } from "@/lib/bia/config";
import { lerConfiguracoes } from "@/lib/configuracoes";
import { Alert } from "@/components/ui/alert";
import { Indicador, TituloAdmin } from "@/components/admin/ui";
import { BotaoReindexar, TextoForm } from "./bia-client";

export const metadata = { title: "BIA" };

type Uso = { perguntas: number; falhas: number; alunos: number; custo_usd: number; trechos: number; fontes: number };

export default async function BiaAdminPage() {
  const supabase = await createClient();
  const [{ data: uso }, { data: textos }, { count: semTranscricao }, config] = await Promise.all([
    supabase.rpc("bia_resumo_uso"),
    supabase.from("bia_fontes").select("id, titulo, texto, atualizado_em").eq("tipo", "texto").order("atualizado_em", { ascending: false }),
    supabase.from("aulas").select("id", { count: "exact", head: true }).eq("publicado", true).is("transcricao", null),
    lerConfiguracoes(supabase),
  ]);
  const u = (uso ?? {}) as Partial<Uso>;
  const custo = Number(u.custo_usd ?? 0);

  return (
    <>
      <TituloAdmin titulo="BIA" descricao="A BIA responde só com base nas transcrições das aulas publicadas e nos textos extras abaixo. Sem trecho encontrado, ela não chama a IA e não gasta nada." />

      {!biaConfigurada() ? (
        <Alert variant="warn" className="mb-6">A chave da IA não está configurada. Crie uma chave em console.anthropic.com e salve como ANTHROPIC_API_KEY nas variáveis da Vercel (INSTALACAO.md, passo 4).</Alert>
      ) : (
        <Alert variant="ok" className="mb-6">Chave configurada. Modelo em uso: <code>{BIA_MODELO}</code>. Cota: {config.bia_cota_mensal} perguntas por aluno/mês (mude em Configurações).</Alert>
      )}

      <div className="grid gap-3 sm:grid-cols-4">
        <Indicador rotulo="Perguntas no mês" valor={u.perguntas ?? 0} detalhe={u.falhas ? `${u.falhas} com falha` : undefined} />
        <Indicador rotulo="Alunos que usaram" valor={u.alunos ?? 0} />
        <Indicador rotulo="Custo no mês" valor={`US$ ${custo.toFixed(custo < 1 ? 4 : 2)}`} detalhe="estimado" />
        <Indicador rotulo="Base de conhecimento" valor={u.trechos ?? 0} detalhe={`trechos em ${u.fontes ?? 0} fonte(s)`} />
      </div>

      {!!semTranscricao && (
        <Alert variant="info" className="mt-4">{semTranscricao} aula(s) publicada(s) sem transcrição: a BIA não sabe o conteúdo delas. Cole a transcrição em Admin → Curso.</Alert>
      )}

      <section className="cartao mt-6 space-y-4 p-5">
        <div>
          <h2 className="font-semibold">Textos extras</h2>
          <p className="text-sm text-muted-foreground">Perguntas frequentes, regras da turma, informações sobre o produto, bônus, suporte. Tudo que você quer que a BIA saiba além das aulas.</p>
        </div>
        {(textos ?? []).map((t) => (
          <details key={t.id} className="rounded-lg border border-border">
            <summary className="cursor-pointer px-4 py-3 text-sm font-medium">{t.titulo}</summary>
            <div className="border-t border-border p-4"><TextoForm texto={{ id: t.id, titulo: t.titulo, texto: t.texto ?? "" }} /></div>
          </details>
        ))}
        <div className="rounded-lg bg-muted/50 p-4">
          <h3 className="mb-3 text-sm font-semibold">Novo texto</h3>
          <TextoForm />
        </div>
      </section>

      <section className="cartao mt-6 flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <h2 className="font-semibold">Reindexar aulas</h2>
          <p className="text-sm text-muted-foreground">Salvar a aula já atualiza a BIA. Use só se importou aulas direto no banco.</p>
        </div>
        <BotaoReindexar />
      </section>
    </>
  );
}

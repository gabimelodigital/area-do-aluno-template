import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { encontrarOuCriarAluno, buscarAluno } from "@/lib/alunos";
import { normalizarTransacaoGuru, situacaoGuru } from "@/lib/guru";

type Resultado = { resultado: "processado" | "ignorado" | "erro"; detalhe: string };

/**
 * Aplica um evento já gravado em guru_eventos. Usado pelo webhook e pelo botão
 * "Reprocessar" do admin. Nunca lança: o resultado vai para o log do evento.
 */
export async function processarEventoGuru(admin: SupabaseClient, eventoId: string): Promise<Resultado> {
  const r = await aplicar(admin, eventoId).catch((e: unknown): Resultado => ({
    resultado: "erro",
    detalhe: e instanceof Error ? e.message : "erro desconhecido",
  }));
  await admin
    .from("guru_eventos")
    .update({ resultado: r.resultado, detalhe: r.detalhe.slice(0, 500), processado_em: new Date().toISOString() })
    .eq("id", eventoId);
  return r;
}

async function aplicar(admin: SupabaseClient, eventoId: string): Promise<Resultado> {
  const { data: evento, error } = await admin.from("guru_eventos").select("payload").eq("id", eventoId).single();
  if (error || !evento) throw new Error("Evento não encontrado.");
  const transacao = normalizarTransacaoGuru(evento.payload as Record<string, unknown>);
  if (!transacao) return { resultado: "ignorado", detalhe: "Não é um evento de transação." };

  const situacao = situacaoGuru(transacao.status);
  if (!situacao) return { resultado: "ignorado", detalhe: `Status "${transacao.status}" não muda o acesso.` };

  const { data: produtos } = await admin.from("guru_produtos").select("produto_id, dias_acesso").eq("ativo", true).in("produto_id", transacao.produtos);
  const produto = produtos?.[0];
  if (!produto) {
    return { resultado: "ignorado", detalhe: `Produto não cadastrado em Admin > Guru (ids recebidos: ${transacao.produtos.join(", ") || "nenhum"}).` };
  }

  let userId: string | null;
  if (situacao === "ativo") {
    const conta = await encontrarOuCriarAluno(admin, { email: transacao.email, nome: transacao.nome });
    if (!conta.ok) throw new Error(conta.error);
    userId = conta.userId;
  } else {
    // Reembolso de quem nunca teve conta: nada a bloquear.
    userId = await buscarAluno(admin, transacao.email);
    if (!userId) return { resultado: "ignorado", detalhe: "Aluno não existe; nada a bloquear." };
  }

  const { data: aplicado, error: erroRpc } = await admin.rpc("aplicar_evento_guru", {
    p_user_id: userId,
    p_referencia: transacao.referencia,
    p_produto_id: produto.produto_id,
    p_situacao: situacao,
    p_origem_em: transacao.origemEm,
    p_aprovado_em: transacao.aprovadoEm,
    p_dias: produto.dias_acesso,
  });
  if (erroRpc) throw new Error(`Banco: ${erroRpc.message}`);
  return { resultado: "processado", detalhe: String(aplicado) };
}

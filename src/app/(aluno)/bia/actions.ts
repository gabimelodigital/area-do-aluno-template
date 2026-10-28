"use server";

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { urlAula } from "@/lib/curso";
import { BIA_MODELO, SISTEMA, custoUsd } from "@/lib/bia/config";

export type FonteBia = { titulo: string; url: string | null };
export type TurnoBia = { papel: "aluno" | "bia"; texto: string };
export type RespostaBia = { ok: true; resposta: string; fontes: FonteBia[] } | { ok: false; error: string };

type Trecho = { conteudo: string; fonte_tipo: "aula" | "texto"; fonte_titulo: string; aula_id: string | null; modulo_id: string | null; similaridade: number };

const SEM_BASE = "Ainda não encontrei essa resposta no conteúdo que aprendi. Confira as aulas do Método ou pergunte na comunidade.";

export async function perguntarBia(pergunta: string, historico: TurnoBia[] = []): Promise<RespostaBia> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Entre na sua conta para conversar com a BIA." };

  const texto = typeof pergunta === "string" ? pergunta.trim().slice(0, 600) : "";
  if (texto.length < 3) return { ok: false, error: "Escreva uma pergunta com pelo menos três caracteres." };
  const chave = process.env.ANTHROPIC_API_KEY?.trim();
  if (!chave) return { ok: false, error: "A BIA ainda não foi configurada. Avise a equipe." };

  // 1. Busca os trechos mais parecidos nas aulas publicadas e nos textos extras.
  const { data, error } = await supabase.rpc("bia_buscar", { p_pergunta: texto, p_limite: 8 });
  if (error) {
    console.error("bia_buscar:", error.message);
    return { ok: false, error: "Não consegui consultar o conteúdo agora. Tente novamente." };
  }
  const encontrados = (data ?? []) as Trecho[];
  const melhor = Math.max(0, ...encontrados.map((t) => t.similaridade));
  const trechos = encontrados.filter((t) => t.similaridade >= melhor * 0.85);
  // Sem trecho, não chama a IA (e não gasta cota).
  if (!trechos.length) return { ok: true, resposta: SEM_BASE, fontes: [] };

  // 2. Reserva a pergunta na cota mensal do aluno.
  const { data: reserva, error: erroCota } = await supabase.rpc("bia_reservar_pergunta");
  if (erroCota || !reserva) {
    return { ok: false, error: erroCota?.code === "P0001" ? erroCota.message : "Não consegui registrar sua pergunta agora. Tente novamente." };
  }

  const contexto = trechos.map((t, i) => `[${i + 1}] ${t.fonte_titulo}\n${t.conteudo}`).join("\n\n");
  const anteriores: Anthropic.MessageParam[] = (Array.isArray(historico) ? historico : [])
    .slice(-4)
    .filter((t) => (t?.papel === "aluno" || t?.papel === "bia") && typeof t.texto === "string")
    .map((t) => ({ role: t.papel === "aluno" ? "user" : "assistant", content: t.texto.slice(0, 600) }));

  try {
    // 3. Pergunta ao Claude só com os trechos encontrados.
    const client = new Anthropic({ apiKey: chave, timeout: 40_000, maxRetries: 1 });
    const resposta = await client.messages.create({
      model: BIA_MODELO,
      max_tokens: 2000,
      system: SISTEMA,
      output_config: { effort: "low" },
      messages: [...anteriores, { role: "user", content: `Trechos do conteúdo:\n${contexto}\n\nPergunta: ${texto}` }],
    });
    const conteudo = resposta.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("\n").trim();
    const entrada = resposta.usage.input_tokens;
    const saida = resposta.usage.output_tokens;
    if (resposta.stop_reason === "refusal" || !conteudo) throw new Error(`Sem resposta (${resposta.stop_reason})`);

    await supabase.rpc("bia_finalizar_pergunta", {
      p_id: reserva, p_sucesso: true, p_modelo: resposta.model,
      p_tokens_entrada: entrada, p_tokens_saida: saida, p_custo_usd: custoUsd(BIA_MODELO, entrada, saida),
    });

    const fontes: FonteBia[] = [];
    for (const t of trechos) {
      const url = t.aula_id && t.modulo_id ? urlAula(t.modulo_id, t.aula_id) : null;
      if (!fontes.some((f) => f.titulo === t.fonte_titulo)) fontes.push({ titulo: t.fonte_titulo, url });
    }
    return { ok: true, resposta: conteudo, fontes: fontes.slice(0, 3) };
  } catch (causa) {
    // Falha não consome cota.
    await supabase.rpc("bia_finalizar_pergunta", { p_id: reserva, p_sucesso: false });
    console.error("Pergunte à BIA:", causa instanceof Anthropic.APIError ? `${causa.status} ${causa.message}` : causa);
    return { ok: false, error: "Não consegui responder agora. Tente novamente em instantes." };
  }
}

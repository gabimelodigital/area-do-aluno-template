import { createHash, timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { lerJsonLimitado } from "@/lib/http";
import { normalizarTransacaoGuru } from "@/lib/guru";
import { processarEventoGuru } from "@/lib/guru-processar";

export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "no-store" };
const resposta = (corpo: Record<string, string>, status = 200) => Response.json(corpo, { status, headers });
const digest = (v: string) => createHash("sha256").update(v).digest();

// Webhook de vendas da Guru. Configure na Guru: Configurações > Webhooks, com a
// URL https://SEU-DOMINIO/api/webhooks/guru (ver INSTALACAO.md).
export async function POST(request: Request) {
  const token = process.env.GURU_API_TOKEN?.trim();
  if (!token) {
    console.error("GURU_API_TOKEN não configurado.");
    return resposta({ erro: "integracao_nao_configurada" }, 503);
  }

  let payload: Record<string, unknown>;
  try {
    payload = await lerJsonLimitado(request, 256 * 1024);
  } catch {
    return resposta({ erro: "corpo_invalido" }, 400);
  }

  // A Guru manda o token da conta dentro do corpo (api_token). Comparação em tempo constante.
  const recebido = typeof payload.api_token === "string" ? payload.api_token : "";
  if (!recebido || !timingSafeEqual(digest(token), digest(recebido))) return resposta({ erro: "nao_autorizado" }, 401);

  let transacao;
  try {
    transacao = normalizarTransacaoGuru(payload);
  } catch {
    return resposta({ erro: "evento_incompleto" }, 400);
  }
  if (!transacao) return resposta({ status: "tipo_nao_processado" });

  // Nunca guardar o token no banco.
  const semToken = { ...payload };
  delete semToken.api_token;
  const chave = createHash("sha256").update(`${transacao.referencia}|${transacao.status}|${transacao.origemEm}`).digest("hex");

  const admin = createAdminClient();
  const { data: evento, error } = await admin
    .from("guru_eventos")
    .insert({ chave, referencia: transacao.referencia, status: transacao.status, email: transacao.email, payload: semToken })
    .select("id")
    .single();
  if (error?.code === "23505") return resposta({ status: "duplicado" });
  if (error || !evento) {
    console.error("guru_eventos:", error?.message);
    return resposta({ erro: "registro_indisponivel" }, 503);
  }

  // Responde 200 mesmo se o processamento falhar: o erro fica no log do admin
  // (Admin > Guru) com botão de reprocessar, e a Guru não desativa o webhook.
  const r = await processarEventoGuru(admin, evento.id);
  return resposta({ status: r.resultado, detalhe: r.detalhe });
}

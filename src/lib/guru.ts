// Contrato de entrada do webhook de vendas da Guru (Digital Manager Guru).
// Formato validado em produção. Referência:
// https://api.docs.digitalmanager.guru/webhooks-vendas
//
// PARA USAR OUTRO GATEWAY: troque este arquivo (normalizar + mapear status) e a
// rota src/app/api/webhooks/guru. O resto (banco, acesso, telas) não muda.

export type TransacaoGuru = {
  referencia: string;          // id da transação
  status: string;              // approved, refunded, chargeback...
  origemEm: string;            // dates.updated_at (ISO) — ordena eventos fora de ordem
  aprovadoEm: string | null;   // dates.confirmed_at (ISO)
  email: string;
  nome: string | null;
  produtos: string[];          // product.id, marketplace_id e internal_id
};

export type Situacao = "ativo" | "reembolsado" | "chargeback" | "disputa";

// O que cada status da Guru faz com o acesso. Status fora da lista (aguardando
// pagamento, cancelado, expirado...) não mexem em nada e ficam só no log.
export function situacaoGuru(status: string): Situacao | null {
  const mapa: Record<string, Situacao> = {
    approved: "ativo",
    completed: "ativo",
    refunded: "reembolsado",
    chargeback: "chargeback",
    dispute: "disputa",
  };
  return mapa[status] ?? null;
}

const objeto = (v: unknown): Record<string, unknown> => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
const texto = (v: unknown, max = 191): string | null => {
  const s = typeof v === "number" ? String(v) : typeof v === "string" ? v.trim() : "";
  return s.length > 0 && s.length <= max ? s : null;
};

// Aceita timestamp em segundos (número ou string de 10 dígitos) ou ISO com fuso.
function instante(v: unknown): string | null {
  const ms =
    typeof v === "number" || (typeof v === "string" && /^\d{10}$/.test(v))
      ? Number(v) * 1000
      : typeof v === "string" && /^\d{4}-\d{2}-\d{2}[T ].*(?:Z|[+-]\d{2}:?\d{2})$/.test(v)
        ? Date.parse(v.replace(" ", "T"))
        : NaN;
  return Number.isFinite(ms) && ms >= Date.UTC(2010, 0, 1) && ms <= Date.now() + 120_000 ? new Date(ms).toISOString() : null;
}

/** null = não é evento de transação (ignorar). Lança erro se faltar campo obrigatório. */
export function normalizarTransacaoGuru(payload: Record<string, unknown>): TransacaoGuru | null {
  if (payload.webhook_type !== "transaction") return null;
  const produto = objeto(payload.product);
  const contato = objeto(payload.contact);
  const datas = objeto(payload.dates);
  const referencia = texto(payload.id);
  const status = texto(payload.status)?.toLowerCase();
  const origemEm = instante(datas.updated_at) ?? instante(datas.created_at);
  const email = texto(contato.email, 254)?.toLowerCase();
  if (!referencia || !status || !origemEm || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("evento_incompleto");
  }
  return {
    referencia,
    status,
    origemEm,
    aprovadoEm: instante(datas.confirmed_at),
    email,
    nome: texto(contato.name, 120),
    produtos: [...new Set([produto.id, produto.marketplace_id, produto.internal_id].map((v) => texto(v)).filter((v): v is string => !!v))],
  };
}

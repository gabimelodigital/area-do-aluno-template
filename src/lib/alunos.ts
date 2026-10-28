import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizarEmail } from "@/lib/auth";

export type ContaAluno = { ok: true; userId: string; criado: boolean } | { ok: false; error: string };

async function idPorEmail(admin: SupabaseClient, email: string): Promise<string | null> {
  const { data } = await admin.from("profiles").select("id").eq("email", email).maybeSingle();
  return data?.id ?? null;
}

export async function buscarAluno(admin: SupabaseClient, email: string): Promise<string | null> {
  const normal = normalizarEmail(email);
  return normal ? idPorEmail(admin, normal) : null;
}

/**
 * Acha o aluno pelo e-mail ou cria a conta com a SENHA_PADRAO_ALUNO.
 * Conta que já existe nunca tem a senha trocada aqui.
 * Quem avisa o aluno (link + e-mail + senha) é a automação do SIV.
 */
export async function encontrarOuCriarAluno(admin: SupabaseClient, input: { email: string; nome?: string | null }): Promise<ContaAluno> {
  const email = normalizarEmail(input.email);
  if (!email) return { ok: false, error: "E-mail inválido." };
  const existente = await idPorEmail(admin, email);
  if (existente) return { ok: true, userId: existente, criado: false };

  const senha = process.env.SENHA_PADRAO_ALUNO?.trim();
  if (!senha || senha.length < 8) {
    return { ok: false, error: "SENHA_PADRAO_ALUNO não configurada (mínimo 8 caracteres). Veja INSTALACAO.md." };
  }
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
    user_metadata: { nome: input.nome?.trim() || null },
  });
  if (error || !data.user) {
    // Corrida: dois eventos da mesma compra ao mesmo tempo. Se a conta apareceu, segue.
    const depois = await idPorEmail(admin, email);
    return depois ? { ok: true, userId: depois, criado: false } : { ok: false, error: `Não foi possível criar a conta: ${error?.message ?? "erro desconhecido"}` };
  }
  return { ok: true, userId: data.user.id, criado: true };
}

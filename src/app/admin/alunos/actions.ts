"use server";

import { revalidatePath } from "next/cache";
import { acaoAdmin, type Resultado } from "@/lib/admin";
import { encontrarOuCriarAluno } from "@/lib/alunos";
import { createAdminClient } from "@/lib/supabase/admin";
import { UUID } from "@/lib/format";

const lerDias = (v: string) => (v.trim() === "" ? null : Number.parseInt(v, 10));

// Cadastra (ou acha) o aluno e libera acesso manual — para bônus, cortesia ou venda fora da Guru.
export async function liberarAluno(input: { email: string; nome: string; dias: string }): Promise<Resultado> {
  return acaoAdmin(async ({ supabase }) => {
    const dias = lerDias(input.dias);
    if (dias !== null && (!Number.isInteger(dias) || dias < 1 || dias > 36500)) return { ok: false, error: "Dias de acesso: deixe vazio (vitalício) ou use 1 a 36500." };
    const conta = await encontrarOuCriarAluno(createAdminClient(), { email: input.email, nome: input.nome });
    if (!conta.ok) return conta;
    const { error } = await supabase.rpc("admin_liberar_acesso", { p_user_id: conta.userId, p_dias: dias });
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/alunos");
    return {
      ok: true,
      msg: conta.criado
        ? "Aluno criado com a senha padrão e acesso liberado. Envie a ele o link da área, o e-mail e a senha padrão."
        : "Acesso liberado para a conta que já existia (a senha dele não mudou).",
    };
  });
}

export async function revogarAluno(userId: string): Promise<Resultado> {
  if (!UUID.test(userId)) return { ok: false, error: "Aluno inválido." };
  return acaoAdmin(async ({ supabase }) => {
    const { error } = await supabase.rpc("admin_revogar_acessos", { p_user_id: userId });
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/alunos");
  });
}

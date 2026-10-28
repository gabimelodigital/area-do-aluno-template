"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { encontrarOuCriarAluno } from "@/lib/alunos";
import { etapaInstalacao } from "@/lib/instalacao";

/**
 * Cria a conta do dono (EMAIL_DONO) com a SENHA_PADRAO_ALUNO e marca como admin.
 * Só funciona enquanto não existe nenhum admin. Se a conta já existia, a senha
 * dela também vira a senha padrão: assim ninguém que tenha se cadastrado antes
 * com o e-mail do dono fica com o controle.
 */
export async function criarDono(): Promise<void> {
  if ((await etapaInstalacao()).etapa !== "dono") redirect("/instalar");

  const admin = createAdminClient();
  const email = process.env.EMAIL_DONO!.trim();
  const conta = await encontrarOuCriarAluno(admin, { email });
  if (!conta.ok) redirect(`/instalar?erro=${encodeURIComponent(conta.error)}`);

  if (!conta.criado) {
    const { error } = await admin.auth.admin.updateUserById(conta.userId, {
      password: process.env.SENHA_PADRAO_ALUNO!.trim(),
      email_confirm: true,
    });
    if (error) redirect(`/instalar?erro=${encodeURIComponent(error.message)}`);
  }

  const { error } = await admin.from("profiles").update({ is_admin: true }).eq("id", conta.userId);
  if (error) redirect(`/instalar?erro=${encodeURIComponent(error.message)}`);
  redirect("/instalar");
}

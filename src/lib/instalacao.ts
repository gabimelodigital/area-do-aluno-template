import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

// Variáveis sem as quais a área não funciona. Guru e BIA podem vir depois.
export const VARIAVEIS_OBRIGATORIAS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "EMAIL_DONO",
  "SENHA_PADRAO_ALUNO",
] as const;

export type Etapa = { etapa: "variaveis"; faltando: string[] } | { etapa: "banco" } | { etapa: "dono" } | { etapa: "pronto" };

/** Em que ponto a instalação está. Usado pela página /instalar. */
export async function etapaInstalacao(): Promise<Etapa> {
  const faltando = VARIAVEIS_OBRIGATORIAS.filter((nome) => !process.env[nome]?.trim());
  if (faltando.length) return { etapa: "variaveis", faltando };

  const admin = createAdminClient();
  const { error } = await admin.from("configuracoes").select("id").limit(1);
  if (error) return { etapa: "banco" };

  const { count } = await admin.from("profiles").select("id", { count: "exact", head: true }).eq("is_admin", true);
  return count ? { etapa: "pronto" } : { etapa: "dono" };
}

// Link direto para o SQL Editor do projeto, a partir da URL do Supabase.
export function linkSqlEditor(): string | null {
  const ref = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/^https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1];
  return ref ? `https://supabase.com/dashboard/project/${ref}/sql/new` : null;
}

export function mascararEmail(email: string): string {
  const [usuario, dominio] = email.split("@");
  return `${usuario.slice(0, 2)}${"*".repeat(Math.max(1, usuario.length - 2))}@${dominio}`;
}

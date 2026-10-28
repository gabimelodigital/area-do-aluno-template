import "server-only";
import { createClient } from "@/lib/supabase/server";

export type Resultado = { ok: true; msg?: string } | { ok: false; error: string };

/** Para server actions do admin: confirma que quem chamou é admin antes de qualquer coisa. */
export async function exigirAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Sessão expirada. Entre novamente.");
  const { data: perfil } = await supabase.from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
  if (!perfil?.is_admin) throw new Error("Somente admin.");
  return { supabase, user };
}

/** Roda a ação e devolve erro legível em vez de quebrar a tela. */
export async function acaoAdmin(fn: (ctx: Awaited<ReturnType<typeof exigirAdmin>>) => Promise<Resultado | void>): Promise<Resultado> {
  try {
    const ctx = await exigirAdmin();
    return (await fn(ctx)) ?? { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro inesperado." };
  }
}

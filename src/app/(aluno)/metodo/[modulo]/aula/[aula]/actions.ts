"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { UUID } from "@/lib/format";

export async function marcarAula(aulaId: string, concluida: boolean): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!UUID.test(aulaId)) return { ok: false, error: "Aula inválida." };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sua sessão expirou. Entre novamente." };
  const { error } = concluida
    ? await supabase.from("aula_progresso").upsert({ user_id: user.id, aula_id: aulaId }, { onConflict: "user_id,aula_id", ignoreDuplicates: true })
    : await supabase.from("aula_progresso").delete().eq("user_id", user.id).eq("aula_id", aulaId);
  if (error) return { ok: false, error: "Não foi possível salvar. Tente novamente." };
  revalidatePath("/metodo", "layout");
  return { ok: true };
}

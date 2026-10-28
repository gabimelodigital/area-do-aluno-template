"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { BUCKET_AVATARES, urlAvatar } from "@/lib/avatar";

type Resultado = { ok: true } | { ok: false; error: string };

export async function salvarNome(nome: string): Promise<Resultado> {
  const limpo = typeof nome === "string" ? nome.trim() : "";
  if (limpo.length < 2 || limpo.length > 120) return { ok: false, error: "Informe seu nome (2 a 120 caracteres)." };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sua sessão expirou. Entre novamente." };
  const { error } = await supabase.from("profiles").update({ nome: limpo }).eq("id", user.id);
  if (error) return { ok: false, error: "Não foi possível salvar. Tente novamente." };
  revalidatePath("/", "layout");
  return { ok: true };
}

// O navegador já recorta e converte a foto em JPEG 512x512 antes de enviar.
export async function salvarFoto(form: FormData): Promise<{ ok: true; url: string | null } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Entre novamente para trocar sua foto." };
  const file = form.get("foto");
  if (!(file instanceof File) || file.size === 0 || file.size > 819200) return { ok: false, error: "Selecione uma imagem válida e tente novamente." };
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (file.type !== "image/jpeg" || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) return { ok: false, error: "Formato de foto inválido." };

  const { data: atual } = await supabase.from("profiles").select("avatar_path").eq("id", user.id).maybeSingle();
  const path = `${user.id}/${crypto.randomUUID()}.jpg`;
  const { error: erroUpload } = await supabase.storage.from(BUCKET_AVATARES).upload(path, bytes, { contentType: "image/jpeg" });
  if (erroUpload) return { ok: false, error: "Não foi possível enviar a foto. Tente novamente." };
  const { error } = await supabase.from("profiles").update({ avatar_path: path }).eq("id", user.id);
  if (error) {
    await supabase.storage.from(BUCKET_AVATARES).remove([path]);
    return { ok: false, error: "Não foi possível salvar a foto. Tente novamente." };
  }
  if (atual?.avatar_path) await supabase.storage.from(BUCKET_AVATARES).remove([atual.avatar_path]);
  revalidatePath("/", "layout");
  return { ok: true, url: await urlAvatar(supabase, path) };
}

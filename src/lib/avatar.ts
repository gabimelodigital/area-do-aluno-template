import type { SupabaseClient } from "@supabase/supabase-js";

export const BUCKET_AVATARES = "avatares";

// O bucket é privado: a foto sai por URL assinada de 1 hora.
export async function urlAvatar(supabase: SupabaseClient, path?: string | null) {
  if (!path) return null;
  const { data } = await supabase.storage.from(BUCKET_AVATARES).createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

export async function urlsAvatares(supabase: SupabaseClient, paths: (string | null | undefined)[]) {
  const unicos = [...new Set(paths.filter((p): p is string => !!p))];
  if (!unicos.length) return new Map<string, string>();
  const { data } = await supabase.storage.from(BUCKET_AVATARES).createSignedUrls(unicos, 3600);
  return new Map((data ?? []).flatMap((d) => (d.path && d.signedUrl ? [[d.path, d.signedUrl] as const] : [])));
}

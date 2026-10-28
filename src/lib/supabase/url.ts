// Aceita a URL do Supabase do jeito que a pessoa colar: com ou sem "/rest/v1/",
// com barra no fim ou espaços. O cliente precisa só de https://<ref>.supabase.co
export function urlSupabase(): string | undefined {
  const bruta = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  return bruta ? bruta.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "") : undefined;
}

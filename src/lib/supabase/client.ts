import { createBrowserClient } from "@supabase/ssr";

const FALTANDO =
  "Variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY não definidas. Configure e reinicie (veja INSTALACAO.md).";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error(FALTANDO);
  return createBrowserClient(url, anonKey);
}

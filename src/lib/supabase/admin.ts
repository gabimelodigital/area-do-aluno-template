import { createClient as createBaseClient } from "@supabase/supabase-js";
import { urlSupabase } from "./url";

/**
 * Client com service_role: ignora RLS. Usar APENAS no servidor (webhook e ações
 * de admin já verificadas). Nunca importar em componente "use client".
 */
export function createAdminClient() {
  const url = urlSupabase();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias no servidor (veja INSTALACAO.md).",
    );
  }
  return createBaseClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

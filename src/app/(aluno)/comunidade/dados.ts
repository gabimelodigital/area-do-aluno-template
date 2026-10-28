import type { SupabaseClient } from "@supabase/supabase-js";
import { urlsAvatares } from "@/lib/avatar";
import type { DadosComunidade } from "./types";

// Troca o caminho da foto de cada autor por uma URL assinada (bucket privado).
export async function prepararFotos(supabase: SupabaseClient, dados: DadosComunidade) {
  const itens = [...dados.posts, ...dados.respostas];
  const urls = await urlsAvatares(supabase, itens.map((i) => i.autor?.avatar));
  for (const item of itens) if (item.autor) item.autor.avatar = item.autor.avatar ? urls.get(item.autor.avatar) ?? null : null;
}

"use server";

import { revalidatePath } from "next/cache";
import { acaoAdmin, type Resultado } from "@/lib/admin";
import { dividirEmTrechos } from "@/lib/bia/trechos";
import { UUID } from "@/lib/format";

// Textos extras: FAQ, regras da turma, informações do produto. A BIA usa como fonte.
export async function salvarTexto(input: { id?: string; titulo: string; texto: string }): Promise<Resultado> {
  if (input.id && !UUID.test(input.id)) return { ok: false, error: "Texto inválido." };
  const titulo = input.titulo?.trim() ?? "";
  const texto = input.texto?.trim() ?? "";
  if (!titulo || titulo.length > 200) return { ok: false, error: "Dê um título de até 200 caracteres." };
  if (texto.length < 20) return { ok: false, error: "Escreva pelo menos algumas frases." };
  return acaoAdmin(async ({ supabase }) => {
    const trechos = dividirEmTrechos(`${titulo}. ${texto.slice(0, 200000)}`);
    const { error } = await supabase.rpc("bia_indexar", { p_tipo: "texto", p_id: input.id ?? null, p_aula_id: null, p_titulo: titulo, p_texto: texto.slice(0, 200000), p_trechos: trechos });
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/bia");
    return { ok: true, msg: `Salvo. BIA aprendeu ${trechos.length} trecho(s).` };
  });
}

export async function apagarTexto(id: string): Promise<Resultado> {
  if (!UUID.test(id)) return { ok: false, error: "Texto inválido." };
  return acaoAdmin(async ({ supabase }) => {
    const { error } = await supabase.from("bia_fontes").delete().eq("id", id).eq("tipo", "texto");
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/bia");
  });
}

// Reindexa a transcrição de todas as aulas (útil depois de importar aulas direto no banco).
export async function reindexarAulas(): Promise<Resultado> {
  return acaoAdmin(async ({ supabase }) => {
    const { data: aulas, error } = await supabase.from("aulas").select("id, titulo, transcricao");
    if (error) return { ok: false, error: error.message };
    let total = 0;
    for (const a of aulas ?? []) {
      const trechos = a.transcricao ? dividirEmTrechos(`${a.titulo}. ${a.transcricao}`) : [];
      const { error: e } = await supabase.rpc("bia_indexar", { p_tipo: "aula", p_id: null, p_aula_id: a.id, p_titulo: a.titulo, p_texto: null, p_trechos: trechos });
      if (e) return { ok: false, error: `Aula "${a.titulo}": ${e.message}` };
      total += trechos.length;
    }
    revalidatePath("/admin/bia");
    return { ok: true, msg: `${aulas?.length ?? 0} aula(s) reindexada(s), ${total} trecho(s).` };
  });
}

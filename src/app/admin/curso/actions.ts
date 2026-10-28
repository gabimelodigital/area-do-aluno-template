"use server";

import { revalidatePath } from "next/cache";
import { acaoAdmin, type Resultado } from "@/lib/admin";
import { dividirEmTrechos } from "@/lib/bia/trechos";
import { UUID } from "@/lib/format";
import type { Material } from "@/lib/curso";

const atualizar = () => {
  revalidatePath("/admin/curso", "layout");
  revalidatePath("/metodo", "layout");
};

export async function salvarModulo(input: { id?: string; titulo: string; descricao: string; ordem: number; publicado: boolean }): Promise<Resultado & { id?: string }> {
  if (input.id && !UUID.test(input.id)) return { ok: false, error: "Módulo inválido." };
  const titulo = input.titulo?.trim() ?? "";
  if (!titulo || titulo.length > 200) return { ok: false, error: "Dê um título de até 200 caracteres." };
  let novoId: string | undefined;
  const r = await acaoAdmin(async ({ supabase }) => {
    const dados = { titulo, descricao: input.descricao?.trim().slice(0, 1000) || null, ordem: Number.isFinite(input.ordem) ? Math.trunc(input.ordem) : 0, publicado: !!input.publicado };
    if (input.id) {
      const { error } = await supabase.from("modulos").update(dados).eq("id", input.id);
      if (error) return { ok: false, error: error.message };
    } else {
      const { data: ultimo } = await supabase.from("modulos").select("ordem").order("ordem", { ascending: false }).limit(1).maybeSingle();
      const { data, error } = await supabase.from("modulos").insert({ ...dados, ordem: (ultimo?.ordem ?? 0) + 1 }).select("id").single();
      if (error) return { ok: false, error: error.message };
      novoId = data.id;
    }
    atualizar();
  });
  return r.ok ? { ...r, id: novoId } : r;
}

export async function apagarModulo(id: string): Promise<Resultado> {
  if (!UUID.test(id)) return { ok: false, error: "Módulo inválido." };
  return acaoAdmin(async ({ supabase }) => {
    const { error } = await supabase.from("modulos").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    atualizar();
  });
}

export async function criarAula(moduloId: string, titulo: string): Promise<Resultado & { id?: string }> {
  if (!UUID.test(moduloId)) return { ok: false, error: "Módulo inválido." };
  const limpo = titulo?.trim() ?? "";
  if (!limpo || limpo.length > 200) return { ok: false, error: "Dê um título de até 200 caracteres." };
  let id: string | undefined;
  const r = await acaoAdmin(async ({ supabase }) => {
    const { data: ultima } = await supabase.from("aulas").select("ordem").eq("modulo_id", moduloId).order("ordem", { ascending: false }).limit(1).maybeSingle();
    const { data, error } = await supabase.from("aulas").insert({ modulo_id: moduloId, titulo: limpo, ordem: (ultima?.ordem ?? 0) + 1 }).select("id").single();
    if (error) return { ok: false, error: error.message };
    id = data.id;
    atualizar();
  });
  return r.ok ? { ...r, id } : r;
}

// Uma linha por material: "Nome do material | https://link"
function lerMateriaisTexto(texto: string): Material[] | string {
  const materiais: Material[] = [];
  for (const linha of (texto ?? "").split("\n").map((l) => l.trim()).filter(Boolean)) {
    const [label, url] = linha.split("|").map((p) => p?.trim());
    if (!label || !url || !/^https?:\/\/\S+$/i.test(url)) return `Material inválido: "${linha}". Use: Nome | https://link`;
    materiais.push({ label: label.slice(0, 120), url: url.slice(0, 500) });
  }
  return materiais;
}

export async function salvarAula(input: {
  id: string; titulo: string; descricao: string; video_url: string; materiais: string; transcricao: string; ordem: number; publicado: boolean;
}): Promise<Resultado> {
  if (!UUID.test(input.id)) return { ok: false, error: "Aula inválida." };
  const titulo = input.titulo?.trim() ?? "";
  if (!titulo || titulo.length > 200) return { ok: false, error: "Dê um título de até 200 caracteres." };
  const video = input.video_url?.trim() ?? "";
  if (video && !/^https?:\/\/\S+$/i.test(video)) return { ok: false, error: "Link do vídeo inválido (precisa começar com https://)." };
  const materiais = lerMateriaisTexto(input.materiais);
  if (typeof materiais === "string") return { ok: false, error: materiais };
  const transcricao = input.transcricao?.trim().slice(0, 200000) || null;

  return acaoAdmin(async ({ supabase }) => {
    const { error } = await supabase.from("aulas").update({
      titulo, descricao: input.descricao?.trim().slice(0, 2000) || null, video_url: video || null, materiais, transcricao,
      ordem: Number.isFinite(input.ordem) ? Math.trunc(input.ordem) : 0, publicado: !!input.publicado,
    }).eq("id", input.id);
    if (error) return { ok: false, error: error.message };

    // Mantém a base da BIA em dia com a transcrição (vazia = sai da base).
    const trechos = transcricao ? dividirEmTrechos(`${titulo}. ${transcricao}`) : [];
    const { error: erroBia } = await supabase.rpc("bia_indexar", { p_tipo: "aula", p_id: null, p_aula_id: input.id, p_titulo: titulo, p_texto: null, p_trechos: trechos });
    atualizar();
    if (erroBia) return { ok: true, msg: `Aula salva, mas a BIA não indexou: ${erroBia.message}` };
    return { ok: true, msg: trechos.length ? `Aula salva. BIA aprendeu ${trechos.length} trecho(s) desta aula.` : "Aula salva." };
  });
}

export async function apagarAula(id: string): Promise<Resultado> {
  if (!UUID.test(id)) return { ok: false, error: "Aula inválida." };
  return acaoAdmin(async ({ supabase }) => {
    const { error } = await supabase.from("aulas").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    atualizar();
  });
}

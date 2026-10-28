"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { UUID } from "@/lib/format";
import { EMOJIS, type Canal } from "./types";

type Resultado = { ok: true } | { ok: false; error: string };
const invalido: Resultado = { ok: false, error: "Dados inválidos. Atualize a página e tente novamente." };

// Toda escrita passa por uma função do banco que valida acesso, permissão e texto.
async function executar(funcao: string, params: Record<string, string | boolean>): Promise<Resultado> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Sua sessão expirou. Entre novamente para continuar." };
    const { error } = await supabase.rpc(funcao, params);
    if (error) return { ok: false, error: error.code === "P0001" ? error.message : "Não foi possível salvar. Tente novamente." };
    revalidatePath("/comunidade", "layout");
    return { ok: true };
  } catch {
    return { ok: false, error: "Não foi possível conectar. Tente novamente." };
  }
}

export async function criarPost(input: { canal: Canal; titulo: string; corpo: string }): Promise<Resultado> {
  if (!input || typeof input.titulo !== "string" || typeof input.corpo !== "string") return invalido;
  if (!input.titulo.trim() || input.titulo.trim().length > 200 || !input.corpo.trim() || input.corpo.trim().length > 10000)
    return { ok: false, error: "Preencha o título (até 200 caracteres) e a mensagem (até 10.000 caracteres)." };
  return executar("app_comunidade_criar_post", { p_canal: input.canal, p_titulo: input.titulo.trim(), p_corpo: input.corpo.trim() });
}

export async function responder(postId: string, corpo: string): Promise<Resultado> {
  if (!UUID.test(postId) || typeof corpo !== "string") return invalido;
  if (!corpo.trim() || corpo.trim().length > 10000) return { ok: false, error: "Escreva uma resposta de até 10.000 caracteres." };
  return executar("app_comunidade_responder", { p_post_id: postId, p_corpo: corpo.trim() });
}

export async function apagar(id: string, tipo: "post" | "resposta"): Promise<Resultado> {
  return UUID.test(id) && (tipo === "post" || tipo === "resposta") ? executar("app_comunidade_apagar", { p_id: id, p_tipo: tipo }) : invalido;
}

export async function reagir(postId: string, emoji: string): Promise<Resultado> {
  return UUID.test(postId) && EMOJIS.includes(emoji) ? executar("app_comunidade_reagir", { p_post_id: postId, p_emoji: emoji }) : invalido;
}

export async function fixar(postId: string, fixado: boolean): Promise<Resultado> {
  return UUID.test(postId) && typeof fixado === "boolean" ? executar("app_comunidade_fixar", { p_id: postId, p_fixado: fixado }) : invalido;
}

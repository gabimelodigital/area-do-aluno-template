"use server";

import { revalidatePath } from "next/cache";
import { acaoAdmin, type Resultado } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { processarEventoGuru } from "@/lib/guru-processar";
import { UUID } from "@/lib/format";

export async function salvarProduto(input: { produto_id: string; nome: string; dias: string }): Promise<Resultado> {
  const produtoId = input.produto_id?.trim() ?? "";
  const nome = input.nome?.trim() ?? "";
  const dias = input.dias?.trim() ? Number.parseInt(input.dias, 10) : null;
  if (!produtoId || produtoId.length > 191) return { ok: false, error: "Informe o ID do produto na Guru." };
  if (!nome) return { ok: false, error: "Dê um nome para reconhecer o produto." };
  if (dias !== null && (!Number.isInteger(dias) || dias < 1 || dias > 36500)) return { ok: false, error: "Dias de acesso: vazio (vitalício) ou de 1 a 36500." };
  return acaoAdmin(async ({ supabase }) => {
    const { error } = await supabase.from("guru_produtos").upsert({ produto_id: produtoId, nome: nome.slice(0, 200), dias_acesso: dias, ativo: true }, { onConflict: "produto_id" });
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/guru");
  });
}

export async function alternarProduto(id: string, ativo: boolean): Promise<Resultado> {
  if (!UUID.test(id)) return { ok: false, error: "Produto inválido." };
  return acaoAdmin(async ({ supabase }) => {
    const { error } = await supabase.from("guru_produtos").update({ ativo }).eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/guru");
  });
}

export async function apagarProduto(id: string): Promise<Resultado> {
  if (!UUID.test(id)) return { ok: false, error: "Produto inválido." };
  return acaoAdmin(async ({ supabase }) => {
    const { error } = await supabase.from("guru_produtos").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/guru");
  });
}

// Útil quando a venda chegou antes do produto estar cadastrado, ou depois de corrigir uma variável.
export async function reprocessarEvento(id: string): Promise<Resultado> {
  if (!UUID.test(id)) return { ok: false, error: "Evento inválido." };
  return acaoAdmin(async () => {
    const r = await processarEventoGuru(createAdminClient(), id);
    revalidatePath("/admin/guru");
    return r.resultado === "erro" ? { ok: false, error: r.detalhe } : { ok: true, msg: `${r.resultado}: ${r.detalhe}` };
  });
}

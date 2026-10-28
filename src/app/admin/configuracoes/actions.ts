"use server";

import { revalidatePath } from "next/cache";
import { acaoAdmin, type Resultado } from "@/lib/admin";
import type { Configuracoes } from "@/lib/configuracoes";

export async function salvarConfiguracoes(input: Configuracoes): Promise<Resultado> {
  const whatsapp = (input.whatsapp_numero ?? "").replace(/\D/g, "");
  if (whatsapp && (whatsapp.length < 10 || whatsapp.length > 15)) {
    return { ok: false, error: "WhatsApp: use DDI + DDD + número, só dígitos. Ex.: 5511999998888." };
  }
  const video = input.comece_video_url?.trim() ?? "";
  if (video && !/^https?:\/\/\S+$/i.test(video)) return { ok: false, error: "Link do vídeo inválido (precisa começar com https://)." };
  const cota = Math.trunc(Number(input.bia_cota_mensal));
  if (!Number.isFinite(cota) || cota < 0 || cota > 10000) return { ok: false, error: "Cota da BIA: de 0 a 10000 perguntas por mês." };
  const nome = input.nome_area?.trim() ?? "";
  if (!nome || nome.length > 80) return { ok: false, error: "Nome da área: de 1 a 80 caracteres." };

  return acaoAdmin(async ({ supabase }) => {
    const { error } = await supabase
      .from("configuracoes")
      .update({
        nome_area: nome,
        whatsapp_numero: whatsapp || null,
        whatsapp_mensagem: input.whatsapp_mensagem?.trim().slice(0, 300) || "Olá! Vim pela área do aluno e preciso de ajuda.",
        comece_titulo: input.comece_titulo?.trim().slice(0, 120) || "Seu primeiro passo",
        comece_texto: input.comece_texto?.trim().slice(0, 600) ?? "",
        comece_video_url: video || null,
        bia_cota_mensal: cota,
        atualizado_em: new Date().toISOString(),
      })
      .eq("id", true);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/", "layout");
    return { ok: true, msg: "Configurações salvas." };
  });
}

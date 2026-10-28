import type { SupabaseClient } from "@supabase/supabase-js";

export type Configuracoes = {
  nome_area: string;
  whatsapp_numero: string | null;
  whatsapp_mensagem: string;
  comece_titulo: string;
  comece_texto: string;
  comece_video_url: string | null;
  bia_cota_mensal: number;
};

const PADRAO: Configuracoes = {
  nome_area: "Área do Aluno",
  whatsapp_numero: null,
  whatsapp_mensagem: "Olá! Vim pela área do aluno e preciso de ajuda.",
  comece_titulo: "Seu primeiro passo",
  comece_texto: "",
  comece_video_url: null,
  bia_cota_mensal: 100,
};

export async function lerConfiguracoes(supabase: SupabaseClient): Promise<Configuracoes> {
  const { data } = await supabase.from("configuracoes").select("*").maybeSingle();
  return { ...PADRAO, ...(data ?? {}) };
}

/** false = o SQL de instalação ainda não rodou (a tela de login aponta para /instalar). */
export async function bancoInstalado(supabase: SupabaseClient): Promise<boolean> {
  const { error } = await supabase.from("configuracoes").select("id").limit(1);
  return !error;
}

export function linkWhatsapp(config: Pick<Configuracoes, "whatsapp_numero" | "whatsapp_mensagem">): string | null {
  if (!config.whatsapp_numero) return null;
  return `https://wa.me/${config.whatsapp_numero}?text=${encodeURIComponent(config.whatsapp_mensagem)}`;
}

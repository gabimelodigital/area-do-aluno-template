import { createClient } from "@/lib/supabase/server";
import { lerConfiguracoes, linkWhatsapp } from "@/lib/configuracoes";
import { TelaAuth } from "@/components/auth/tela-auth";
import { IconeWhatsapp } from "@/components/whatsapp";

export const dynamic = "force-dynamic";
export const metadata = { title: "Acesso não ativo" };

export default async function SemAcessoPage() {
  const supabase = await createClient();
  const [{ data: { user } }, config] = await Promise.all([supabase.auth.getUser(), lerConfiguracoes(supabase)]);
  const whatsapp = linkWhatsapp(config);
  return (
    <TelaAuth titulo="Seu acesso não está ativo" subtitulo={config.nome_area}>
      <p className="text-sm text-muted-foreground">
        Não encontramos uma compra ativa para <strong className="text-foreground">{user?.email}</strong>. Se você acabou de comprar,
        aguarde alguns minutos e entre de novo. Se o problema continuar, fale com a gente.
      </p>
      {whatsapp && (
        <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] text-sm font-medium text-white hover:bg-[#1fb857]">
          <IconeWhatsapp /> Chamar no WhatsApp
        </a>
      )}
      <form action="/auth/sign-out" method="post">
        <button type="submit" className="w-full text-center text-sm text-muted-foreground underline hover:text-foreground">Entrar com outro e-mail</button>
      </form>
    </TelaAuth>
  );
}

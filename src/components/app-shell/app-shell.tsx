import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { lerConfiguracoes, linkWhatsapp } from "@/lib/configuracoes";
import { urlAvatar } from "@/lib/avatar";
import { iniciais } from "@/lib/format";
import { Logo } from "@/components/logo";
import { WhatsappFlutuante } from "@/components/whatsapp";
import { SidebarNav } from "./sidebar-nav";
import { UserMenu } from "./user-menu";
import { MobileBottomNav } from "./mobile-bottom-nav";

function saudacao() {
  const hora = Number(new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "numeric", hour12: false }));
  return hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";
}

export async function AppShell({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: perfil }, config] = await Promise.all([
    supabase.from("profiles").select("nome, email, avatar_path, is_admin").eq("id", user.id).maybeSingle(),
    lerConfiguracoes(supabase),
  ]);
  const nome = perfil?.nome || perfil?.email || user.email || "Aluno";
  const foto = await urlAvatar(supabase, perfil?.avatar_path);
  const isAdmin = !!perfil?.is_admin;
  const whatsapp = linkWhatsapp(config);

  return (
    <div className="min-h-svh bg-background">
      <aside className="fixed left-0 top-0 z-30 hidden h-svh w-60 border-r border-border bg-card lg:flex lg:flex-col">
        <div className="flex h-16 items-center border-b border-border px-5">
          <Logo />
        </div>
        <SidebarNav isAdmin={isAdmin} whatsapp={whatsapp} />
      </aside>

      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-card px-4 lg:hidden">
        <Logo />
        <UserMenu nome={nome} iniciais={iniciais(nome)} foto={foto} />
      </header>

      <header className="sticky top-0 z-20 hidden h-16 items-center justify-between border-b border-border bg-card/80 px-6 backdrop-blur lg:ml-60 lg:flex">
        <div>
          <p className="text-sm text-muted-foreground">
            {saudacao()}, <span className="font-medium text-foreground">{nome.split(" ")[0]}</span>
          </p>
          <p className="text-xs text-muted-foreground/70">{config.nome_area}</p>
        </div>
        <UserMenu nome={nome} iniciais={iniciais(nome)} foto={foto} />
      </header>

      <main className="lg:pl-60">
        <div className="px-4 py-6 pb-32 lg:px-8 lg:py-8 lg:pb-16">{children}</div>
      </main>

      <WhatsappFlutuante href={whatsapp} />
      <MobileBottomNav isAdmin={isAdmin} whatsapp={whatsapp} />
    </div>
  );
}

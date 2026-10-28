import { createClient } from "@/lib/supabase/server";
import { urlAvatar } from "@/lib/avatar";
import { formatarData } from "@/lib/format";
import { AlterarSenha } from "@/components/auth/alterar-senha";
import { PerfilClient } from "./perfil-client";

export const metadata = { title: "Meu perfil" };
export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [{ data: perfil }, { data: acessos }] = await Promise.all([
    supabase.from("profiles").select("nome, email, avatar_path").eq("id", user!.id).maybeSingle(),
    supabase.from("acessos").select("valido_ate").eq("user_id", user!.id).eq("status", "ativo").is("revogado_em", null),
  ]);
  const foto = await urlAvatar(supabase, perfil?.avatar_path);
  const vitalicio = (acessos ?? []).some((a) => !a.valido_ate);
  const ate = (acessos ?? []).map((a) => a.valido_ate).filter(Boolean).sort().at(-1) ?? null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Meu perfil</h1>
      <section className="cartao p-5">
        <PerfilClient nomeInicial={perfil?.nome ?? ""} email={perfil?.email ?? user!.email ?? ""} foto={foto} />
      </section>
      <section className="cartao space-y-3 p-5">
        <h2 className="font-semibold">Seu acesso</h2>
        <p className="text-sm text-muted-foreground">
          {vitalicio ? "Acesso vitalício." : ate ? `Acesso ativo até ${formatarData(ate)}.` : "Acesso liberado pela equipe."}
        </p>
      </section>
      <section className="cartao space-y-3 p-5">
        <h2 className="font-semibold">Trocar senha</h2>
        <p className="text-sm text-muted-foreground">Se você entrou com a senha padrão da compra, crie uma senha só sua.</p>
        <AlterarSenha />
      </section>
    </div>
  );
}

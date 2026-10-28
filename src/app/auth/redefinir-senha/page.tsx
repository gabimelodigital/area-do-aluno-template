import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AlterarSenha } from "@/components/auth/alterar-senha";
import { TelaAuth } from "@/components/auth/tela-auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Criar nova senha" };

// Chega aqui pelo link de "criar nova senha" do e-mail (já com a sessão aberta).
export default async function RedefinirSenhaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/recuperar");
  return (
    <TelaAuth titulo="Crie sua nova senha">
      <AlterarSenha depois="/comece-aqui" />
    </TelaAuth>
  );
}

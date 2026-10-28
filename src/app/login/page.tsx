import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { TelaAuth } from "@/components/auth/tela-auth";
import { Alert } from "@/components/ui/alert";
import { createClient } from "@/lib/supabase/server";
import { bancoInstalado, lerConfiguracoes } from "@/lib/configuracoes";

export const metadata = { title: "Entrar" };

export default async function LoginPage() {
  const supabase = await createClient();
  const [config, instalado] = await Promise.all([lerConfiguracoes(supabase), bancoInstalado(supabase)]);
  return (
    <TelaAuth subtitulo={config.nome_area}>
      {!instalado && (
        <Alert variant="warn">
          Primeira vez aqui? <Link href="/instalar" className="font-medium underline">Termine a instalação</Link>.
        </Alert>
      )}
      <Suspense fallback={<p className="text-sm text-muted-foreground">Carregando…</p>}>
        <LoginForm />
      </Suspense>
    </TelaAuth>
  );
}

import { createClient } from "@/lib/supabase/server";
import { lerConfiguracoes } from "@/lib/configuracoes";
import { TituloAdmin } from "@/components/admin/ui";
import { ConfiguracoesForm } from "./configuracoes-client";

export const metadata = { title: "Configurações" };

export default async function ConfiguracoesPage() {
  const config = await lerConfiguracoes(await createClient());
  return (
    <>
      <TituloAdmin titulo="Configurações" descricao="Textos e contatos da sua área. Logo, cores e páginas novas você muda pedindo ao Claude ou ao GPT (INSTALACAO.md, passo 6)." />
      <ConfiguracoesForm inicial={config} />
    </>
  );
}

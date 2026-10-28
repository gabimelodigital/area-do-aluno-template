import { createClient } from "@/lib/supabase/server";
import { biaConfigurada } from "@/lib/bia/config";
import { Alert } from "@/components/ui/alert";
import { BiaChat } from "./bia-chat";

export const metadata = { title: "Pergunte à BIA" };
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export default async function BiaPage() {
  // Sugestões: títulos das primeiras aulas publicadas viram perguntas prontas.
  const { data: aulas } = await (await createClient())
    .from("aulas").select("titulo").eq("publicado", true).not("transcricao", "is", null).order("ordem").limit(3);
  const sugestoes = (aulas ?? []).map((a) => `Me explica o principal da aula "${a.titulo}"`);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold">Pergunte à BIA</h1>
      <p className="mt-1 text-sm text-muted-foreground">Suas dúvidas sobre o conteúdo, em um só lugar.</p>

      <div className="mt-6 rounded-2xl border border-brand/20 bg-gradient-to-br from-brand/5 to-cyan/10 px-5 py-4">
        <div className="flex items-center gap-3">
          <span aria-hidden className="text-2xl">🤖</span>
          <div>
            <h2 className="font-semibold">Travou em algum ponto? Me pergunta.</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">Eu respondo com base nas aulas e mostro de qual aula veio, pra você revisar direto na fonte.</p>
          </div>
        </div>
      </div>

      {!biaConfigurada() && <Alert variant="warn" className="mt-6">A BIA ainda não foi configurada pela equipe. Volte em breve.</Alert>}
      <BiaChat sugestoes={sugestoes} />
    </div>
  );
}

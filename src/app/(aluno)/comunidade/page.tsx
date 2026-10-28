import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Alert } from "@/components/ui/alert";
import { ComunidadeClient } from "./comunidade-client";
import { prepararFotos } from "./dados";
import { CANAIS, type Canal, type DadosComunidade } from "./types";

export const metadata = { title: "Comunidade" };
export const dynamic = "force-dynamic";

export default async function ComunidadePage({ searchParams }: { searchParams: Promise<{ canal?: string; pagina?: string }> }) {
  const params = await searchParams;
  const canal: Canal = CANAIS.some((c) => c.id === params.canal) ? (params.canal as Canal) : "apresente-se";
  const pagina = Math.min(10000, Math.max(1, Number.parseInt(params.pagina ?? "1", 10) || 1));
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase.rpc("app_comunidade", { p_canal: canal, p_offset: (pagina - 1) * 50 });
  const dados = data as DadosComunidade | null;
  if (dados) await prepararFotos(supabase, dados);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold">Comunidade</h1>
      <p className="mt-1 text-sm text-muted-foreground">Tire dúvidas, compartilhe avanços e converse com a turma.</p>
      <div className="mt-6">
        {error || !dados ? (
          <Alert variant="err">
            Não foi possível carregar a comunidade. <Link className="underline" href={`/comunidade?canal=${canal}`}>Tentar novamente</Link>
          </Alert>
        ) : (
          <>
            <ComunidadeClient key={`${canal}-${pagina}`} canal={canal} posts={dados.posts} userId={user!.id} isAdmin={dados.is_admin} />
            <nav aria-label="Páginas da comunidade" className="mt-5 flex justify-between text-sm">
              {pagina > 1 ? <Link className="underline" href={`/comunidade?canal=${canal}&pagina=${pagina - 1}`}>← Anteriores</Link> : <span />}
              {pagina * 50 < dados.total && <Link className="underline" href={`/comunidade?canal=${canal}&pagina=${pagina + 1}`}>Próximos →</Link>}
            </nav>
          </>
        )}
      </div>
    </div>
  );
}

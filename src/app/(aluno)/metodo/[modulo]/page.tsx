import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Circle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { UUID } from "@/lib/format";
import { urlAula } from "@/lib/curso";

export const dynamic = "force-dynamic";

export default async function ModuloPage({ params }: { params: Promise<{ modulo: string }> }) {
  const { modulo: moduloId } = await params;
  if (!UUID.test(moduloId)) notFound();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [{ data: modulo }, { data: aulas }, { data: progresso }] = await Promise.all([
    supabase.from("modulos").select("id, titulo, descricao").eq("id", moduloId).eq("publicado", true).maybeSingle(),
    supabase.from("aulas").select("id, titulo, descricao").eq("modulo_id", moduloId).eq("publicado", true).order("ordem").order("criado_em"),
    supabase.from("aula_progresso").select("aula_id").eq("user_id", user!.id),
  ]);
  if (!modulo) notFound();
  const feitas = new Set((progresso ?? []).map((p) => p.aula_id));

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/metodo" className="text-sm text-muted-foreground hover:text-foreground">← Método</Link>
      <h1 className="mt-2 text-2xl font-bold">{modulo.titulo}</h1>
      {modulo.descricao && <p className="mt-1 text-sm text-muted-foreground">{modulo.descricao}</p>}

      {!aulas?.length ? (
        <p className="mt-6 rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">Nenhuma aula publicada neste módulo ainda.</p>
      ) : (
        <ol className="mt-6 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {aulas.map((a, i) => {
            const feita = feitas.has(a.id);
            return (
              <li key={a.id}>
                <Link href={urlAula(moduloId, a.id)} className="flex items-start gap-3 px-5 py-4 transition hover:bg-muted/60">
                  {feita ? (
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-label="Concluída" />
                  ) : (
                    <Circle className="mt-0.5 size-5 shrink-0 text-muted-foreground/60" aria-label="Não concluída" />
                  )}
                  <div className="min-w-0">
                    <p className="font-medium">
                      <span className="mr-1 text-muted-foreground">{String(i + 1).padStart(2, "0")}.</span> {a.titulo}
                    </p>
                    {a.descricao && <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">{a.descricao}</p>}
                  </div>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

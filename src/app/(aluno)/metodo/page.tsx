import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Modulo } from "@/lib/curso";

export const metadata = { title: "Método" };
export const dynamic = "force-dynamic";

export default async function MetodoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [{ data: modulos }, { data: aulas }, { data: progresso }] = await Promise.all([
    supabase.from("modulos").select("id, titulo, descricao, ordem, publicado").eq("publicado", true).order("ordem").order("criado_em"),
    supabase.from("aulas").select("id, modulo_id").eq("publicado", true),
    supabase.from("aula_progresso").select("aula_id").eq("user_id", user!.id),
  ]);
  const feitas = new Set((progresso ?? []).map((p) => p.aula_id));
  const lista = (modulos ?? []) as Modulo[];

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold">Método</h1>
      <p className="mt-1 text-sm text-muted-foreground">Siga os módulos na ordem. Cada aula concluída fica marcada.</p>

      {lista.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Os módulos aparecem aqui assim que forem publicados.
        </div>
      ) : (
        <ol className="mt-6 space-y-3">
          {lista.map((m, i) => {
            const doModulo = (aulas ?? []).filter((a) => a.modulo_id === m.id);
            const concluidas = doModulo.filter((a) => feitas.has(a.id)).length;
            const pct = doModulo.length ? Math.round((concluidas / doModulo.length) * 100) : 0;
            return (
              <li key={m.id}>
                <Link href={`/metodo/${m.id}`} className="group flex items-center gap-4 rounded-xl border border-border bg-card p-5 transition hover:border-brand">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary text-base font-bold text-primary-foreground">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold">{m.titulo}</h2>
                    {m.descricao && <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{m.descricao}</p>}
                    <div className="mt-3 flex items-center gap-3">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                        <div className="h-full rounded-full bg-success" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">{concluidas}/{doModulo.length} aulas</span>
                    </div>
                  </div>
                  <ChevronRight className="size-5 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

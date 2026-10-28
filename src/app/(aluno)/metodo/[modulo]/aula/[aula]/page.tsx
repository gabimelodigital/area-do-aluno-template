import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { UUID } from "@/lib/format";
import { lerMateriais, urlAula } from "@/lib/curso";
import { PlayerVideo } from "@/components/player-video";
import { BotaoConcluir } from "./botao-concluir";

export const dynamic = "force-dynamic";

export default async function AulaPage({ params }: { params: Promise<{ modulo: string; aula: string }> }) {
  const { modulo: moduloId, aula: aulaId } = await params;
  if (!UUID.test(moduloId) || !UUID.test(aulaId)) notFound();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [{ data: modulo }, { data: aulas }, { data: feita }] = await Promise.all([
    supabase.from("modulos").select("id, titulo").eq("id", moduloId).eq("publicado", true).maybeSingle(),
    supabase.from("aulas").select("id, titulo, descricao, video_url, materiais").eq("modulo_id", moduloId).eq("publicado", true).order("ordem").order("criado_em"),
    supabase.from("aula_progresso").select("aula_id").eq("user_id", user!.id).eq("aula_id", aulaId).maybeSingle(),
  ]);
  const indice = (aulas ?? []).findIndex((a) => a.id === aulaId);
  if (!modulo || indice < 0) notFound();
  const aula = aulas![indice];
  const anterior = aulas![indice - 1];
  const proxima = aulas![indice + 1];
  const materiais = lerMateriais(aula.materiais);

  return (
    <div className="mx-auto max-w-4xl">
      <Link href={`/metodo/${moduloId}`} className="text-sm text-muted-foreground hover:text-foreground">← {modulo.titulo}</Link>
      <h1 className="mt-2 text-2xl font-bold">{aula.titulo}</h1>

      <div className="mt-5 overflow-hidden rounded-xl border border-border bg-card">
        <PlayerVideo url={aula.video_url} titulo={aula.titulo} />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <BotaoConcluir aulaId={aula.id} concluida={!!feita} />
        <div className="flex gap-2">
          {anterior && (
            <Link href={urlAula(moduloId, anterior.id)} className="inline-flex h-8 items-center gap-1 rounded-lg border border-border px-2.5 text-sm hover:bg-muted">
              <ChevronLeft className="size-4" /> Anterior
            </Link>
          )}
          {proxima && (
            <Link href={urlAula(moduloId, proxima.id)} className="inline-flex h-8 items-center gap-1 rounded-lg border border-border px-2.5 text-sm hover:bg-muted">
              Próxima <ChevronRight className="size-4" />
            </Link>
          )}
        </div>
      </div>

      {aula.descricao && <p className="mt-6 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{aula.descricao}</p>}

      {materiais.length > 0 && (
        <section className="mt-6">
          <h2 className="text-sm font-semibold">Materiais</h2>
          <ul className="mt-2 space-y-2">
            {materiais.map((m) => (
              <li key={m.url}>
                <a href={m.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm hover:border-brand">
                  <FileText className="size-4 text-brand" /> {m.label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UUID } from "@/lib/format";
import type { Modulo } from "@/lib/curso";
import { Badge } from "@/components/ui/badge";
import { TituloAdmin } from "@/components/admin/ui";
import { ModuloForm, NovaAulaForm } from "../curso-client";

export const metadata = { title: "Editar módulo" };

export default async function ModuloAdminPage({ params }: { params: Promise<{ modulo: string }> }) {
  const { modulo: id } = await params;
  if (!UUID.test(id)) notFound();
  const supabase = await createClient();
  const [{ data: modulo }, { data: aulas }] = await Promise.all([
    supabase.from("modulos").select("id, titulo, descricao, ordem, publicado").eq("id", id).maybeSingle(),
    supabase.from("aulas").select("id, titulo, ordem, publicado, transcricao").eq("modulo_id", id).order("ordem").order("criado_em"),
  ]);
  if (!modulo) notFound();

  return (
    <>
      <Link href="/admin/curso" className="text-sm text-muted-foreground hover:text-foreground">← Curso</Link>
      <div className="mt-2"><TituloAdmin titulo={modulo.titulo} /></div>
      <section className="cartao p-5">
        <ModuloForm modulo={modulo as Modulo} />
      </section>

      <section className="mt-6">
        <h2 className="mb-3 font-semibold">Aulas</h2>
        <ul className="cartao divide-y divide-border">
          {(aulas ?? []).map((a) => (
            <li key={a.id}>
              <Link href={`/admin/curso/${id}/aula/${a.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/60">
                <span className="w-8 text-center text-sm text-muted-foreground">{a.ordem}</span>
                <span className="min-w-0 flex-1 truncate">{a.titulo}</span>
                {!a.transcricao && <span className="hidden text-xs text-muted-foreground sm:inline">sem transcrição</span>}
                <Badge variant={a.publicado ? "done" : "lvl"}>{a.publicado ? "publicada" : "rascunho"}</Badge>
              </Link>
            </li>
          ))}
          {!aulas?.length && <li className="px-4 py-6 text-center text-sm text-muted-foreground">Nenhuma aula neste módulo.</li>}
        </ul>
        <div className="mt-3"><NovaAulaForm moduloId={id} /></div>
      </section>
    </>
  );
}

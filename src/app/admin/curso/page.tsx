import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { TituloAdmin } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { ModuloForm } from "./curso-client";

export const metadata = { title: "Curso" };

export default async function CursoAdminPage() {
  const supabase = await createClient();
  const [{ data: modulos }, { data: aulas }] = await Promise.all([
    supabase.from("modulos").select("id, titulo, ordem, publicado").order("ordem").order("criado_em"),
    supabase.from("aulas").select("modulo_id, publicado"),
  ]);

  return (
    <>
      <TituloAdmin titulo="Curso" descricao="Monte o Método: módulos em ordem, aulas dentro de cada módulo. Só aparece para o aluno o que estiver publicado." />
      <ul className="space-y-2">
        {(modulos ?? []).map((m) => {
          const doModulo = (aulas ?? []).filter((a) => a.modulo_id === m.id);
          return (
            <li key={m.id}>
              <Link href={`/admin/curso/${m.id}`} className="cartao flex items-center gap-3 p-4 transition hover:border-brand">
                <span className="w-8 text-center text-sm font-semibold text-muted-foreground">{m.ordem}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{m.titulo}</p>
                  <p className="text-xs text-muted-foreground">{doModulo.length} aula(s) · {doModulo.filter((a) => a.publicado).length} publicada(s)</p>
                </div>
                <Badge variant={m.publicado ? "done" : "lvl"}>{m.publicado ? "publicado" : "rascunho"}</Badge>
                <ChevronRight className="size-4 text-muted-foreground" />
              </Link>
            </li>
          );
        })}
        {!modulos?.length && <li className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Nenhum módulo ainda. Crie o primeiro abaixo.</li>}
      </ul>
      <section className="cartao mt-6 p-5">
        <h2 className="mb-3 font-semibold">Novo módulo</h2>
        <ModuloForm />
      </section>
    </>
  );
}

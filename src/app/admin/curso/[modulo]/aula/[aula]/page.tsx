import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UUID } from "@/lib/format";
import { lerMateriais, urlAula, type Aula } from "@/lib/curso";
import { TituloAdmin } from "@/components/admin/ui";
import { AulaForm } from "../../../curso-client";

export const metadata = { title: "Editar aula" };

export default async function AulaAdminPage({ params }: { params: Promise<{ modulo: string; aula: string }> }) {
  const { modulo: moduloId, aula: aulaId } = await params;
  if (!UUID.test(moduloId) || !UUID.test(aulaId)) notFound();
  const supabase = await createClient();
  const { data } = await supabase.from("aulas").select("*").eq("id", aulaId).eq("modulo_id", moduloId).maybeSingle();
  if (!data) notFound();
  const aula: Aula = { ...data, materiais: lerMateriais(data.materiais) };

  return (
    <>
      <Link href={`/admin/curso/${moduloId}`} className="text-sm text-muted-foreground hover:text-foreground">← Módulo</Link>
      <div className="mt-2">
        <TituloAdmin titulo={aula.titulo}>
          <Link href={urlAula(moduloId, aulaId)} className="text-sm underline">Ver como aluno</Link>
        </TituloAdmin>
      </div>
      <section className="cartao p-5">
        <AulaForm aula={aula} />
      </section>
    </>
  );
}

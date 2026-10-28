import { createClient } from "@/lib/supabase/server";
import { formatarData } from "@/lib/format";
import { TituloAdmin } from "@/components/admin/ui";
import { BotaoRevogar, LiberarAcessoForm } from "./alunos-client";

export const metadata = { title: "Alunos" };

type Aluno = { id: string; email: string; nome: string | null; is_admin: boolean; criado_em: string; acesso_ativo: boolean; valido_ate: string | null; origem: string | null };

export default async function AlunosPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_listar_alunos", { p_busca: q?.slice(0, 100) ?? null });
  const alunos = (data ?? []) as Aluno[];

  return (
    <>
      <TituloAdmin titulo="Alunos" descricao="Quem compra pela Guru entra sozinho. Aqui você busca, libera acesso manual (bônus, cortesia) ou bloqueia." />
      <LiberarAcessoForm />

      <form className="mt-6 flex gap-2">
        <input name="q" defaultValue={q} placeholder="Buscar por nome ou e-mail" className="inp min-w-0 flex-1 py-2" />
        <button className="rounded-lg border border-border px-3 text-sm hover:bg-muted">Buscar</button>
      </form>

      {error && <p className="mt-4 text-sm text-destructive">Erro ao listar: {error.message}</p>}
      <div className="cartao mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Aluno</th>
              <th className="px-4 py-3">Acesso</th>
              <th className="px-4 py-3">Desde</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {alunos.map((a) => (
              <tr key={a.id}>
                <td className="px-4 py-3">
                  <p className="font-medium">{a.nome || "—"} {a.is_admin && <span className="ml-1 rounded-full bg-brand/12 px-2 py-0.5 text-xs text-brand">admin</span>}</p>
                  <p className="text-xs text-muted-foreground">{a.email}</p>
                </td>
                <td className="px-4 py-3">
                  {a.is_admin ? (
                    <span className="text-xs text-muted-foreground">sempre</span>
                  ) : a.acesso_ativo ? (
                    <span className="text-xs text-[#15803d]">● ativo {a.valido_ate ? `até ${formatarData(a.valido_ate)}` : "(vitalício)"}{a.origem === "manual" ? " · manual" : ""}</span>
                  ) : (
                    <span className="text-xs text-destructive">● sem acesso</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{formatarData(a.criado_em)}</td>
                <td className="px-4 py-3 text-right">{!a.is_admin && a.acesso_ativo && <BotaoRevogar userId={a.id} email={a.email} />}</td>
              </tr>
            ))}
            {!alunos.length && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Nenhum aluno encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

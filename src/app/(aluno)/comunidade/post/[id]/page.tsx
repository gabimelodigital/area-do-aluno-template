import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UUID } from "@/lib/format";
import { Alert } from "@/components/ui/alert";
import { prepararFotos } from "../../dados";
import type { DadosComunidade } from "../../types";
import { PostDetalhe } from "./post-detalhe";

export const metadata = { title: "Conversa" };
export const dynamic = "force-dynamic";

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase.rpc("app_comunidade", { p_post_id: id });
  const dados = data as DadosComunidade | null;
  if (error || !dados) {
    return <Alert variant="err">Não foi possível carregar a conversa. <Link className="underline" href="/comunidade">Voltar à comunidade</Link></Alert>;
  }
  const post = dados.posts[0];
  if (!post) notFound();
  await prepararFotos(supabase, dados);

  return (
    <div className="mx-auto max-w-3xl">
      <Link href={`/comunidade?canal=${post.canal}`} className="text-sm text-muted-foreground hover:text-foreground">← Voltar à comunidade</Link>
      <PostDetalhe post={post} respostas={dados.respostas} userId={user!.id} isAdmin={dados.is_admin} />
    </div>
  );
}

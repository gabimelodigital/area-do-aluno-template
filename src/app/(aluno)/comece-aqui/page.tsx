import Link from "next/link";
import { ArrowRight, BookOpen, Bot, MessageCircle, PlayCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { lerConfiguracoes } from "@/lib/configuracoes";
import { PlayerVideo } from "@/components/player-video";

export const metadata = { title: "Comece Aqui" };
export const dynamic = "force-dynamic";

const PASSOS = [
  { href: "/metodo", icon: BookOpen, titulo: "1. Assista ao Método", texto: "Siga os módulos na ordem e marque cada aula concluída.", acao: "Abrir o método" },
  { href: "/comunidade?canal=apresente-se", icon: MessageCircle, titulo: "2. Apresente-se", texto: "Conte para a turma quem você é e qual é o seu objetivo.", acao: "Ir à comunidade" },
  { href: "/bia", icon: Bot, titulo: "3. Tire dúvidas com a BIA", texto: "Pergunte e receba a resposta com a aula de onde ela veio.", acao: "Perguntar à BIA" },
];

export default async function ComeceAquiPage() {
  const config = await lerConfiguracoes(await createClient());
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-brand">Comece aqui</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{config.comece_titulo}</h1>
        {config.comece_texto && <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">{config.comece_texto}</p>}
      </header>

      <section aria-labelledby="aula-boas-vindas" className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <h2 id="aula-boas-vindas" className="flex items-center gap-2 px-4 py-4 font-semibold sm:px-6">
          <PlayCircle className="size-5 text-brand" aria-hidden="true" />
          Boas-vindas
        </h2>
        <PlayerVideo url={config.comece_video_url} titulo="Vídeo de boas-vindas" />
      </section>

      <section aria-labelledby="proximos-passos">
        <h2 id="proximos-passos" className="text-lg font-semibold">Depois do vídeo, dê o próximo passo</h2>
        <p className="mt-1 text-sm text-muted-foreground">Você não precisa usar tudo de uma vez. Comece pelo método e avance no seu ritmo.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {PASSOS.map(({ href, icon: Icon, titulo, texto, acao }) => (
            <Link key={href} href={href} className="group rounded-xl border border-border bg-card p-5 transition hover:border-brand focus-visible:outline-2 focus-visible:outline-brand">
              <Icon className="mb-3 size-5 text-brand" aria-hidden="true" />
              <h3 className="font-semibold">{titulo}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{texto}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand">
                {acao} <ArrowRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

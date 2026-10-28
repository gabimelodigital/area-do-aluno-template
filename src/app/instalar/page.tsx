import { readFile } from "node:fs/promises";
import path from "node:path";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { TelaAuth } from "@/components/auth/tela-auth";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { etapaInstalacao, linkSqlEditor, mascararEmail } from "@/lib/instalacao";
import { CopiarSql } from "./copiar-sql";
import { criarDono } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Instalação" };

function Passo({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3 text-sm">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{n}</span>
      <span className="pt-0.5">{children}</span>
    </li>
  );
}

// Assistente de instalação: guia o dono do começo ao fim, uma etapa por vez.
export default async function InstalarPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams;
  const estado = await etapaInstalacao();

  if (estado.etapa === "variaveis") {
    return (
      <TelaAuth titulo="Faltam chaves na Vercel" subtitulo="Instalação">
        <p className="text-sm text-muted-foreground">Na Vercel, abra o projeto → <strong>Settings</strong> → <strong>Environment Variables</strong> e cadastre:</p>
        <ul className="space-y-1">
          {estado.faltando.map((nome) => <li key={nome}><code className="rounded bg-muted px-2 py-1 text-xs">{nome}</code></li>)}
        </ul>
        <p className="text-sm text-muted-foreground">Depois vá em <strong>Deployments</strong> → <strong>⋯</strong> → <strong>Redeploy</strong> e abra esta página de novo.</p>
      </TelaAuth>
    );
  }

  if (estado.etapa === "banco") {
    const sql = await readFile(path.join(process.cwd(), "supabase", "instalacao.sql"), "utf8");
    const link = linkSqlEditor();
    return (
      <TelaAuth titulo="Passo 1 de 2: preparar o banco" subtitulo="Instalação">
        <ol className="space-y-3">
          <Passo n={1}>Clique no botão abaixo para copiar o código do banco.</Passo>
          <Passo n={2}>
            {link ? <a href={link} target="_blank" rel="noopener noreferrer" className="font-medium underline">Abra o SQL Editor do seu Supabase</a> : <>Abra o seu Supabase → <strong>SQL Editor</strong></>}, clique no espaço em branco e aperte <strong>Ctrl+V</strong>.
          </Passo>
          <Passo n={3}>Clique em <strong>Run</strong>. Tem que aparecer <strong>Success</strong>.</Passo>
          <Passo n={4}>Volte aqui e clique em <strong>Já rodei, continuar</strong>.</Passo>
        </ol>
        <CopiarSql sql={sql} />
        <Link href="/instalar" className="flex h-9 w-full items-center justify-center rounded-lg border border-border text-sm font-medium hover:bg-muted">Já rodei, continuar</Link>
      </TelaAuth>
    );
  }

  const email = process.env.EMAIL_DONO!.trim();

  if (estado.etapa === "dono") {
    return (
      <TelaAuth titulo="Passo 2 de 2: criar sua conta de dono" subtitulo="Instalação">
        <Alert variant="ok">Banco pronto.</Alert>
        <p className="text-sm text-muted-foreground">
          Vamos criar a conta de dono com o e-mail <strong className="text-foreground">{mascararEmail(email)}</strong> e a
          <strong className="text-foreground"> senha padrão</strong> que você cadastrou na Vercel.
        </p>
        {erro && <Alert variant="err">{erro}</Alert>}
        <form action={criarDono}>
          <Button type="submit" size="lg" className="w-full">Criar minha conta de dono</Button>
        </form>
      </TelaAuth>
    );
  }

  return (
    <TelaAuth titulo="Instalação concluída" subtitulo="Instalação">
      <p className="flex items-center gap-2 text-sm"><CheckCircle2 className="size-5 text-success" /> Sua área está no ar.</p>
      <p className="text-sm text-muted-foreground">
        Entre com o e-mail do dono e a senha padrão. Depois troque a senha em <strong>Meu perfil</strong> e siga o
        <strong> Painel</strong> do admin para ligar a Guru, a BIA e o WhatsApp.
      </p>
      <Link href="/login" className="flex h-9 w-full items-center justify-center rounded-lg bg-brand text-sm font-medium text-brand-foreground hover:bg-brand/90">Ir para o login</Link>
    </TelaAuth>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { destinoSeguro, mensagemErroLink } from "@/lib/auth";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type Modo = "senha" | "link";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const destino = destinoSeguro(params.get("redirect"));

  // Quem compra recebe e-mail e senha: a primeira aba é a de senha.
  const [modo, setModo] = useState<Modo>("senha");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [estado, setEstado] = useState<"livre" | "enviando" | "enviado">("livre");
  const [erro, setErro] = useState<string | null>(
    params.get("error") === "link_expirado" ? "Esse link expirou ou já foi usado. Peça outro." : null,
  );

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setEstado("enviando");
    setErro(null);
    const supabase = createClient();

    if (modo === "link") {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(destino)}`, shouldCreateUser: false },
      });
      if (error) {
        setEstado("livre");
        setErro(mensagemErroLink(error.message));
        return;
      }
      setEstado("enviado");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha });
    if (error) {
      setEstado("livre");
      setErro(error.message.includes("Invalid login credentials") ? "E-mail ou senha incorretos." : "Não foi possível entrar agora. Tente de novo.");
      return;
    }
    router.push(destino);
    router.refresh();
  }

  if (estado === "enviado") {
    return (
      <div role="status" className="space-y-3 text-center">
        <div className="text-3xl">📬</div>
        <h2 className="text-lg font-semibold">Link enviado</h2>
        <p className="text-sm text-muted-foreground">
          Confira o e-mail <strong className="text-foreground">{email}</strong> e clique no link para entrar.
        </p>
        <p className="text-xs text-muted-foreground">Não chegou? Olhe o spam ou tente de novo em 1 minuto.</p>
        <button type="button" onClick={() => setEstado("livre")} className="text-xs text-muted-foreground underline hover:text-foreground">
          Voltar
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={entrar} className="space-y-4">
      <div className="inline-flex rounded-lg border border-border bg-muted p-1">
        {(["senha", "link"] as const).map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={modo === m}
            onClick={() => {
              setModo(m);
              setErro(null);
            }}
            className={`rounded-md px-3 py-1 text-xs transition ${modo === m ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            {m === "senha" ? "E-mail + senha" : "Link mágico"}
          </button>
        ))}
      </div>

      <div>
        <label htmlFor="email" className="rotulo">E-mail</label>
        <input id="email" type="email" required autoComplete="email" autoFocus disabled={estado === "enviando"} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" className="inp w-full py-2" />
      </div>

      {modo === "senha" && (
        <div>
          <label htmlFor="senha" className="rotulo">Senha</label>
          <input id="senha" type="password" required autoComplete="current-password" disabled={estado === "enviando"} value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Sua senha" className="inp w-full py-2" />
        </div>
      )}

      {erro && <Alert variant="err">{erro}</Alert>}

      <Button type="submit" size="lg" disabled={estado === "enviando" || !email.trim() || (modo === "senha" && !senha)} className="w-full">
        {estado === "enviando" ? "Entrando..." : modo === "link" ? "Receber link mágico" : "Entrar"}
      </Button>

      <p className="text-xs text-muted-foreground">
        {modo === "link" ? "Sem senha: enviamos um link para o seu e-mail. Clique e pronto." : "Use o e-mail da sua compra e a senha que você recebeu."}
      </p>

      <Link href="/auth/recuperar" className="block text-center text-sm text-muted-foreground underline hover:text-foreground">
        Esqueci minha senha
      </Link>
    </form>
  );
}

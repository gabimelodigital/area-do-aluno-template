"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { mensagemErroLink } from "@/lib/auth";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type Opcao = "nova_senha" | "link_magico";

// Duas saídas para quem esqueceu a senha: criar uma nova ou entrar por link mágico.
export function EsqueciSenha() {
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState<Opcao | null>(null);
  const [enviado, setEnviado] = useState<Opcao | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function enviar(opcao: Opcao) {
    if (!email.trim()) return;
    setEnviando(opcao);
    setErro(null);
    const supabase = createClient();
    const callback = `${window.location.origin}/auth/callback`;
    const { error } =
      opcao === "nova_senha"
        ? await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${callback}?tipo=recuperacao` })
        : await supabase.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: callback, shouldCreateUser: false } });
    setEnviando(null);
    if (error) {
      setErro(mensagemErroLink(error.message));
      return;
    }
    setEnviado(opcao);
  }

  if (enviado) {
    return (
      <div role="status" className="space-y-3 text-center">
        <div className="text-3xl">📬</div>
        <h2 className="text-lg font-semibold">Confira seu e-mail</h2>
        <p className="text-sm text-muted-foreground">
          {enviado === "nova_senha"
            ? <>Se <strong className="text-foreground">{email}</strong> tiver conta, enviamos um link para criar uma senha nova.</>
            : <>Enviamos para <strong className="text-foreground">{email}</strong> um link que entra direto na área.</>}
        </p>
        <p className="text-xs text-muted-foreground">Não chegou? Olhe o spam ou tente de novo em 1 minuto.</p>
        <button type="button" onClick={() => setEnviado(null)} className="text-xs text-muted-foreground underline hover:text-foreground">Voltar</button>
      </div>
    );
  }

  const ocupado = enviando !== null;
  return (
    <form onSubmit={(e) => { e.preventDefault(); enviar("nova_senha"); }} className="space-y-4">
      <div>
        <label htmlFor="email-recuperar" className="rotulo">E-mail da sua conta</label>
        <input id="email-recuperar" type="email" required autoComplete="email" autoFocus maxLength={254} disabled={ocupado} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" className="inp w-full py-2" />
      </div>
      {erro && <Alert variant="err">{erro}</Alert>}
      <Button type="submit" size="lg" disabled={ocupado || !email.trim()} className="w-full">
        {enviando === "nova_senha" ? "Enviando…" : "Criar uma nova senha"}
      </Button>
      <Button type="button" size="lg" variant="outline" onClick={() => enviar("link_magico")} disabled={ocupado || !email.trim()} className="w-full">
        {enviando === "link_magico" ? "Enviando…" : "Entrar com link mágico"}
      </Button>
      <Link href="/login" className="block text-center text-sm text-muted-foreground underline hover:text-foreground">Voltar para o login</Link>
    </form>
  );
}

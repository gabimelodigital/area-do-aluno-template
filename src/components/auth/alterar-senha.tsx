"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

function erroSenha(senha: string, confirmacao: string): string | null {
  if (senha.length < 8) return "Use uma senha com pelo menos 8 caracteres.";
  if (new TextEncoder().encode(senha).length > 72) return "Use uma senha de até 72 bytes.";
  if (senha !== confirmacao) return "As senhas não coincidem.";
  if (/^(.)\1+$/.test(senha) || /^(12345678|password|senha123)/i.test(senha)) return "Escolha uma senha menos previsível.";
  return null;
}

export function AlterarSenha({ depois }: { depois?: string }) {
  const router = useRouter();
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    const problema = erroSenha(senha, confirmacao);
    if (problema) {
      setMsg({ ok: false, texto: problema });
      return;
    }
    setSalvando(true);
    setMsg(null);
    const { error } = await createClient().auth.updateUser({ password: senha });
    setSalvando(false);
    if (error) {
      setMsg({ ok: false, texto: /same|different/i.test(error.message) ? "A nova senha precisa ser diferente da atual." : "Não foi possível trocar a senha. Tente de novo." });
      return;
    }
    setSenha("");
    setConfirmacao("");
    setMsg({ ok: true, texto: "Senha alterada." });
    if (depois) router.push(depois);
  }

  return (
    <form onSubmit={salvar} className="space-y-3">
      <div>
        <label htmlFor="nova-senha" className="rotulo">Nova senha</label>
        <input id="nova-senha" type="password" autoComplete="new-password" required value={senha} onChange={(e) => setSenha(e.target.value)} className="inp w-full py-2" />
      </div>
      <div>
        <label htmlFor="confirmar-senha" className="rotulo">Repita a nova senha</label>
        <input id="confirmar-senha" type="password" autoComplete="new-password" required value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} className="inp w-full py-2" />
      </div>
      {msg && <Alert variant={msg.ok ? "ok" : "err"}>{msg.texto}</Alert>}
      <Button type="submit" disabled={salvando || !senha || !confirmacao}>{salvando ? "Salvando..." : "Salvar nova senha"}</Button>
    </form>
  );
}

import { EsqueciSenha } from "@/components/auth/esqueci-senha";
import { TelaAuth } from "@/components/auth/tela-auth";

export const metadata = { title: "Esqueci minha senha" };

export default function RecuperarPage() {
  return (
    <TelaAuth titulo="Esqueci minha senha">
      <p className="text-sm text-muted-foreground">Digite seu e-mail e escolha: criar uma senha nova ou entrar agora com um link mágico.</p>
      <EsqueciSenha />
    </TelaAuth>
  );
}

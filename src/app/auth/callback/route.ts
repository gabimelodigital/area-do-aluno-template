import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { destinoSeguro } from "@/lib/auth";

// Links padrão dos e-mails do Supabase (formato com `code`). Troca o código por
// sessão. Só funciona no mesmo navegador em que o link foi pedido; para links
// que funcionam em qualquer aparelho, veja /auth/link e o INSTALACAO.md.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const destino = searchParams.get("tipo") === "recuperacao" ? "/auth/redefinir-senha" : destinoSeguro(searchParams.get("next"));
      return NextResponse.redirect(`${origin}${destino}`);
    }
  }
  return NextResponse.redirect(`${origin}/login?error=link_expirado`);
}

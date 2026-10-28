import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { destinoSeguro } from "@/lib/auth";

const headers = { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" };

// Links dos e-mails no formato token_hash (ver INSTALACAO.md, passo opcional dos
// templates de e-mail). A confirmação acontece no servidor, então o link funciona
// em qualquer navegador ou aparelho.
// https://supabase.com/docs/guides/auth/server-side/email-based-auth-with-pkce-flow-for-ssr
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const tipo = searchParams.get("type");
  if (!tokenHash || (tipo !== "email" && tipo !== "recovery" && tipo !== "magiclink")) {
    return NextResponse.redirect(`${origin}/login?error=link_expirado`, { headers });
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: tipo === "magiclink" ? "email" : tipo });
  if (error) return NextResponse.redirect(`${origin}/login?error=link_expirado`, { headers });
  const destino = tipo === "recovery" ? "/auth/redefinir-senha" : destinoSeguro(searchParams.get("next"));
  return NextResponse.redirect(`${origin}${destino}`, { headers });
}

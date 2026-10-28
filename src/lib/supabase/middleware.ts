import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Rotas abertas: login, links de e-mail do Supabase e o assistente de instalação.
const PUBLICAS = ["/login", "/auth", "/instalar"];
// Rotas que só pedem login (sem checar compra ativa).
const SO_LOGIN = ["/sem-acesso"];

function comeca(pathname: string, prefixos: string[]) {
  return prefixos.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

// Copia os cookies de sessão pro redirect. Sem isso o aluno entra em loop de login.
function copiarCookies(de: NextResponse, para: NextResponse) {
  de.cookies.getAll().forEach((cookie) => para.cookies.set(cookie));
  return para;
}

export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error("Variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY não definidas.");

  let resposta = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        resposta = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => resposta.cookies.set(name, value, options));
      },
    },
  });

  // getUser() valida o token no servidor do Supabase (não confia no cookie cego).
  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;
  const redirecionar = (destino: string, params?: Record<string, string>) => {
    const alvo = request.nextUrl.clone();
    alvo.pathname = destino;
    alvo.search = "";
    for (const [k, v] of Object.entries(params ?? {})) alvo.searchParams.set(k, v);
    return copiarCookies(resposta, NextResponse.redirect(alvo));
  };

  if (comeca(pathname, PUBLICAS)) {
    return user && pathname.startsWith("/login") ? redirecionar("/comece-aqui") : resposta;
  }
  if (!user) return redirecionar("/login", pathname === "/" ? {} : { redirect: pathname });
  if (comeca(pathname, SO_LOGIN)) return resposta;

  // Porteiro do acesso: compra ativa, liberação manual ou admin. Reembolso cai aqui.
  const { data: temAcesso } = await supabase.rpc("tem_acesso");
  if (!temAcesso) return redirecionar("/sem-acesso");

  return resposta;
}

const DESTINOS = ["/comece-aqui", "/metodo", "/comunidade", "/bia", "/perfil", "/admin"];

// Só aceita voltar para páginas internas conhecidas (evita redirecionamento aberto).
export function destinoSeguro(valor: unknown, padrao = "/comece-aqui"): string {
  if (typeof valor !== "string" || !valor.startsWith("/") || valor.startsWith("//") || /[\\\s\x00-\x1f]/.test(valor)) return padrao;
  try {
    const url = new URL(valor, "https://area.invalid");
    if (url.origin !== "https://area.invalid" || !DESTINOS.some((p) => url.pathname === p || url.pathname.startsWith(`${p}/`))) return padrao;
    return `${url.pathname}${url.search}`;
  } catch {
    return padrao;
  }
}

// Erros do Supabase Auth ao pedir link por e-mail, em português.
export function mensagemErroLink(mensagem: string): string {
  if (mensagem.includes("Signups not allowed")) return "Não encontramos conta com esse e-mail. Use o e-mail da sua compra.";
  if (/rate limit|security purposes/i.test(mensagem)) return "Muitos pedidos seguidos. Aguarde 1 minuto e tente de novo.";
  return "Não foi possível enviar o e-mail agora. Tente de novo em instantes.";
}

export function normalizarEmail(valor: unknown): string | null {
  if (typeof valor !== "string") return null;
  const email = valor.trim().toLowerCase();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

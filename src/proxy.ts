import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Tudo, menos arquivos estáticos e o webhook da Guru (que tem token próprio).
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|robots.txt|api/webhooks|.*\\.(?:svg|png|jpg|jpeg|gif|webp|json|txt|xml|ico)$).*)",
  ],
};

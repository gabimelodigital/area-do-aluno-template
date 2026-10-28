import { AppShell } from "@/components/app-shell/app-shell";

// Login e acesso ativo já foram checados no proxy (src/lib/supabase/middleware.ts).
export default function AlunoLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}

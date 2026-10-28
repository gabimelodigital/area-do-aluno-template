import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell/app-shell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: perfil } = await supabase.from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
  if (!perfil?.is_admin) redirect("/comece-aqui");
  return (
    <AppShell>
      <div className="mx-auto max-w-5xl">{children}</div>
    </AppShell>
  );
}

import { Logo } from "@/components/logo";

// Moldura das telas de login, recuperação e sem acesso.
export function TelaAuth({ titulo, subtitulo, children }: { titulo?: string; subtitulo?: string; children: React.ReactNode }) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-gradient-to-br from-background to-muted px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Logo className="text-sm" />
          {subtitulo && <p className="text-sm text-muted-foreground">{subtitulo}</p>}
        </div>
        <div className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-card">
          {titulo && <h1 className="text-lg font-semibold">{titulo}</h1>}
          {children}
        </div>
      </div>
    </main>
  );
}

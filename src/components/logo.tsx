import { cn } from "@/lib/utils";

/**
 * TROQUE AQUI A SUA LOGO — é o único lugar.
 * Coloque o arquivo em /public (ex.: public/logo.svg) e troque o <span> por:
 *   <img src="/logo.svg" alt="Nome da sua marca" className={cn("h-7 w-auto", className)} />
 */
export function Logo({ className }: { className?: string }) {
  return (
    <span
      aria-label="Sua logo"
      className={cn(
        "inline-flex items-center rounded-md border-2 border-dashed border-brand/60 px-2.5 py-1 text-xs font-extrabold tracking-[0.25em] text-primary dark:text-foreground",
        className,
      )}
    >
      SUA LOGO
    </span>
  );
}

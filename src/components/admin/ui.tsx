import { cn } from "@/lib/utils";

export function TituloAdmin({ titulo, descricao, children }: { titulo: string; descricao?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold">{titulo}</h1>
        {descricao && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{descricao}</p>}
      </div>
      {children}
    </div>
  );
}

export function Indicador({ rotulo, valor, detalhe }: { rotulo: string; valor: string | number; detalhe?: string }) {
  return (
    <div className="cartao p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{rotulo}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{valor}</p>
      {detalhe && <p className="mt-0.5 text-xs text-muted-foreground">{detalhe}</p>}
    </div>
  );
}

const CORES_RESULTADO: Record<string, string> = {
  processado: "bg-success/14 text-[#15803d]",
  ignorado: "bg-foreground/6 text-muted-foreground",
  erro: "bg-destructive/12 text-destructive",
  recebido: "bg-warning/18 text-[#9a7400]",
};

export function SeloResultado({ resultado }: { resultado: string }) {
  return <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", CORES_RESULTADO[resultado] ?? CORES_RESULTADO.ignorado)}>{resultado}</span>;
}

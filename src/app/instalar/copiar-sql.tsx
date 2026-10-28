"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CopiarSql({ sql }: { sql: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <div className="space-y-2">
      <Button
        type="button"
        size="lg"
        className="w-full"
        onClick={async () => {
          await navigator.clipboard.writeText(sql);
          setCopiado(true);
          setTimeout(() => setCopiado(false), 3000);
        }}
      >
        {copiado ? <Check /> : <Copy />} {copiado ? "Copiado! Agora cole no Supabase" : "Copiar o código do banco"}
      </Button>
      <details className="text-xs text-muted-foreground">
        <summary className="cursor-pointer">Ver o código</summary>
        <textarea readOnly value={sql} rows={8} className="inp mt-2 w-full font-mono text-[11px]" />
      </details>
    </div>
  );
}

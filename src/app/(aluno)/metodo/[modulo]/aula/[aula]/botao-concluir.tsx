"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { marcarAula } from "./actions";

export function BotaoConcluir({ aulaId, concluida }: { aulaId: string; concluida: boolean }) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-3">
      <Button
        size="lg"
        variant={concluida ? "secondary" : "default"}
        disabled={pendente}
        onClick={() =>
          iniciar(async () => {
            const r = await marcarAula(aulaId, !concluida);
            if (!r.ok) setErro(r.error);
            else {
              setErro(null);
              router.refresh();
            }
          })
        }
      >
        {concluida ? <><Check /> Concluída</> : "Marcar como concluída"}
      </Button>
      {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}
    </div>
  );
}

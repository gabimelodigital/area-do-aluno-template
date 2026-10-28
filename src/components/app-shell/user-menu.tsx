"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FotoPerfil } from "@/components/foto-perfil";

export function UserMenu({ nome, iniciais, foto }: { nome: string; iniciais: string; foto?: string | null }) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function fora(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    }
    document.addEventListener("mousedown", fora);
    return () => document.removeEventListener("mousedown", fora);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setAberto(!aberto)}
        aria-expanded={aberto}
        aria-label="Menu do usuário"
        className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground transition hover:bg-primary/85"
      >
        <FotoPerfil url={foto} iniciais={iniciais} />
      </button>
      {aberto && (
        <div className="absolute right-0 z-40 mt-2 w-56 overflow-hidden rounded-lg border border-border bg-popover shadow-lg">
          <p className="truncate border-b border-border px-4 py-3 text-sm font-medium">{nome}</p>
          <ul className="py-1">
            <li>
              <Link href="/perfil" onClick={() => setAberto(false)} className="block px-4 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
                Meu perfil
              </Link>
            </li>
            <li>
              <form action="/auth/sign-out" method="post">
                <button type="submit" className="block w-full px-4 py-2 text-left text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
                  Sair
                </button>
              </form>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}

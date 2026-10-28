"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/logo";
import { NAV_ITEMS, ativo } from "./nav";
import { SidebarNav } from "./sidebar-nav";

// Celular: os 4 itens do aluno na barra + "Menu" com a lista completa (WhatsApp e admin).
export function MobileBottomNav({ isAdmin, whatsapp }: { isAdmin: boolean; whatsapp: string | null }) {
  const pathname = usePathname();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    dialogRef.current?.close();
  }, [pathname]);

  const naBarra = NAV_ITEMS.some((i) => ativo(i.href, pathname));

  return (
    <>
      <nav aria-label="Navegação principal" className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] lg:hidden">
        <ul className="grid grid-cols-5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const marcado = ativo(item.href, pathname);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  prefetch
                  aria-current={marcado ? "page" : undefined}
                  className={`flex flex-col items-center justify-center gap-0.5 py-2 text-xs transition ${marcado ? "font-medium text-primary" : "text-muted-foreground"}`}
                >
                  <Icon className="size-5" />
                  <span className="truncate">{item.curto ?? item.label}</span>
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => {
                dialogRef.current?.showModal();
                setAberto(true);
              }}
              aria-haspopup="dialog"
              aria-expanded={aberto}
              className={`flex w-full flex-col items-center justify-center gap-0.5 py-2 text-xs transition ${naBarra ? "text-muted-foreground" : "font-medium text-primary"}`}
            >
              <Menu className="size-5" />
              <span>Menu</span>
            </button>
          </li>
        </ul>
      </nav>

      <dialog
        ref={dialogRef}
        aria-label="Menu"
        onClose={() => setAberto(false)}
        onClick={(e) => {
          const alvo = e.target as HTMLElement;
          if (alvo === e.currentTarget || alvo.closest("a")) e.currentTarget.close();
        }}
        className="fixed inset-y-0 left-0 m-0 h-dvh max-h-dvh w-72 max-w-[85vw] border-0 bg-card p-0 text-foreground shadow-xl backdrop:bg-black/40 lg:hidden"
      >
        <div className="flex h-full flex-col">
          <div className="flex h-14 items-center justify-between border-b border-border px-4">
            <Logo />
            <button type="button" onClick={() => dialogRef.current?.close()} aria-label="Fechar menu" className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
              <X className="size-5" />
            </button>
          </div>
          <SidebarNav isAdmin={isAdmin} whatsapp={whatsapp} />
        </div>
      </dialog>
    </>
  );
}

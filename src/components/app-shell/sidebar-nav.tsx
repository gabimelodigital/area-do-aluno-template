"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconeWhatsapp } from "@/components/whatsapp";
import { ADMIN_ITEMS, NAV_ITEMS, ativo, type NavItem } from "./nav";

function Itens({ itens, pathname }: { itens: NavItem[]; pathname: string }) {
  return (
    <ul className="space-y-1">
      {itens.map((item) => {
        const Icon = item.icon;
        const marcado = ativo(item.href, pathname);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              prefetch
              aria-current={marcado ? "page" : undefined}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition ${
                marcado ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className="size-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function SidebarNav({ isAdmin, whatsapp }: { isAdmin: boolean; whatsapp: string | null }) {
  const pathname = usePathname();
  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4">
      <Itens itens={NAV_ITEMS} pathname={pathname} />
      {whatsapp && (
        <a
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <IconeWhatsapp className="text-[#25D366]" />
          <span>Chamar no WhatsApp</span>
        </a>
      )}
      {isAdmin && (
        <>
          <div className="mb-2 mt-6 px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Administração</div>
          <Itens itens={ADMIN_ITEMS} pathname={pathname} />
        </>
      )}
    </nav>
  );
}

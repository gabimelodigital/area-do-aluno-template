import { Bot, BookOpen, CreditCard, Layers, LayoutDashboard, MessageCircle, PlayCircle, Settings, Sparkles, Users, type LucideIcon } from "lucide-react";

export type NavItem = { href: string; label: string; curto?: string; icon: LucideIcon };

// Menu do aluno, na ordem em que aparece (computador e celular).
export const NAV_ITEMS: NavItem[] = [
  { href: "/comece-aqui", label: "Comece Aqui", curto: "Início", icon: PlayCircle },
  { href: "/metodo", label: "Método", icon: BookOpen },
  { href: "/comunidade", label: "Comunidade", icon: MessageCircle },
  { href: "/bia", label: "Pergunte à BIA", curto: "BIA", icon: Bot },
];

export const ADMIN_ITEMS: NavItem[] = [
  { href: "/admin", label: "Painel", icon: LayoutDashboard },
  { href: "/admin/alunos", label: "Alunos", icon: Users },
  { href: "/admin/curso", label: "Curso", icon: Layers },
  { href: "/admin/guru", label: "Guru", icon: CreditCard },
  { href: "/admin/bia", label: "BIA", icon: Sparkles },
  { href: "/admin/configuracoes", label: "Configurações", icon: Settings },
];

export function ativo(href: string, pathname: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

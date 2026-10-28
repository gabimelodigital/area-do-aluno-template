# Guia para IA (Claude, Codex e afins)

Este repositório é a área do aluno de **uma** marca: Next.js 16 + Supabase, publicada na Vercel.
Quem pede mudanças aqui normalmente **não é programador**: responda em português simples,
diga o que mudou e como conferir na prévia da Vercel.

## Onde fica cada coisa

| Pedido comum | Arquivo |
|---|---|
| Logo | `src/components/logo.tsx` (único lugar). Imagem em `public/`. Ícone da aba: `public/icon.svg` + `src/app/layout.tsx` |
| Cores | `src/app/globals.css` → valores em `:root` (claro) e `.dark`. `--primary` = cor principal; `--brand` = botões |
| Fonte | `src/app/layout.tsx` (`next/font/google`) |
| Itens do menu | `src/components/app-shell/nav.ts` |
| Nome "BIA" / textos da assistente | `src/app/(aluno)/bia/*`, `src/lib/bia/config.ts` (prompt) e `src/components/app-shell/nav.ts` |
| Tela de login | `src/app/login/page.tsx`, `src/components/auth/*` |
| Comece Aqui | `src/app/(aluno)/comece-aqui/page.tsx` (textos e vídeo vêm do admin → Configurações) |
| Páginas do aluno | `src/app/(aluno)/<página>/page.tsx` (o layout do grupo já aplica o menu) |
| Painel admin | `src/app/admin/*` |
| Banco | `supabase/instalacao.sql` (idempotente) |

## Regras

1. **Nunca** coloque chave, token ou senha em arquivo. Segredos só nas variáveis da Vercel.
2. Página nova do aluno vai em `src/app/(aluno)/...` (assim o porteiro de acesso e o menu valem). Se for para o menu, adicione em `nav.ts`.
3. Use as cores do tema (`bg-primary`, `text-brand`, `text-muted-foreground`, `border-border`), não cores fixas.
4. Mudança no banco: edite `supabase/instalacao.sql` mantendo-o idempotente (`if not exists`, `create or replace`, `drop policy if exists`) e diga ao dono que precisa rodar o arquivo de novo no SQL Editor do Supabase. Nunca use `errcode '40001'`.
5. Antes de terminar, rode `npm run build` e `npm run lint` e corrija os erros.
6. Uma mudança por pedido. Explique no fim, em 2 ou 3 frases, o que mudou e onde conferir.

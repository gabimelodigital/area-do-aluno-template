# Área do Aluno — template

Área de membros enxuta: **Comece Aqui, Método (curso), Comunidade, Pergunte à BIA e Chamar no WhatsApp**, com painel admin e liberação automática de acesso pela **Guru**.

Cada instalação atende **uma** marca (single tenant), com quantos alunos quiser.

## Instalar

1. Crie o projeto no Supabase (passo 1 do [INSTALACAO.md](INSTALACAO.md)).
2. Clique no botão e preencha as chaves:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fgabimelodigital%2Farea-do-aluno-template&project-name=area-do-aluno&repository-name=area-do-aluno&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY,EMAIL_DONO,SENHA_PADRAO_ALUNO&envDescription=Supabase+%28URL+em+Data+API;+Publishable+key+e+Secret+key+em+API+Keys%29,+seu+e-mail+de+dono+e+a+senha+padr%C3%A3o+dos+alunos+%28m%C3%ADn.+8+caracteres%29.&envLink=https%3A%2F%2Fgithub.com%2Fgabimelodigital%2Farea-do-aluno-template%2Fblob%2Fmain%2FINSTALACAO.md)

3. Abra `https://SEU-SITE/instalar` e siga a tela.

O passo a passo completo, sem precisar programar, está no [INSTALACAO.md](INSTALACAO.md).

## Stack

Next.js 16 (App Router) · React 19 · Supabase (Auth, Postgres, Storage) · Tailwind 4 · SDK da Anthropic (BIA) · deploy na Vercel.

## Pré-requisitos

- Node.js 20+ e npm
- Projeto no Supabase (o plano grátis serve para começar)
- Conta na Vercel e no GitHub
- Conta na Guru e chave da API da Anthropic

## Variáveis de ambiente

| Variável | Onde | Para quê |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | pública | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | pública | Publishable key do Supabase (`sb_publishable_`) |
| `SUPABASE_SERVICE_ROLE_KEY` | **secreta** (Secret key `sb_secret_`) | webhook da Guru e criação de alunos |
| `GURU_API_TOKEN` | **secreta** | valida que o webhook veio da sua conta Guru |
| `EMAIL_DONO` | servidor | e-mail do dono; /instalar cria a conta admin com ele |
| `SENHA_PADRAO_ALUNO` | **secreta** | senha de todo aluno novo e senha inicial do dono (mín. 8 caracteres) |
| `ANTHROPIC_API_KEY` | **secreta** | BIA |
| `BIA_MODELO` | opcional | padrão `claude-haiku-5-5` |

Segredo nunca vai em arquivo do repositório. Localmente use `.env.local` (já está no `.gitignore`); em produção, as variáveis da Vercel. Se uma variável faltar, a tela correspondente mostra um aviso claro.

## Rodar local

```bash
npm install
cp .env.example .env.local   # preencha os valores
npm run dev                  # http://localhost:3000
```

Banco: rode `supabase/instalacao.sql` no SQL Editor do Supabase (pode rodar de novo: é idempotente).

## Como funciona

**Acesso.** O porteiro é o `src/proxy.ts` (→ `src/lib/supabase/middleware.ts`): sem login vai para `/login`; logado sem acesso ativo vai para `/sem-acesso`. "Acesso ativo" é a função `tem_acesso()` do banco: compra aprovada dentro da validade, liberação manual, ou admin. As regras do banco (RLS) usam a mesma função, então um aluno reembolsado também não lê nada direto pela API.

**Guru.** `POST /api/webhooks/guru` → confere o `api_token` do corpo → grava o evento em `guru_eventos` (idempotente) → `src/lib/guru-processar.ts` aplica:
- `approved`/`completed`: acha ou cria o aluno com a `SENHA_PADRAO_ALUNO` e libera pelos dias do produto (ou vitalício);
- `refunded`, `chargeback`, `dispute`: bloqueia na hora;
- outros status ou produto não cadastrado: ignorado (fica no log do admin, com botão de reprocessar).

Eventos fora de ordem são resolvidos pela data do evento (`dates.updated_at`), e uma aprovação nunca desfaz um reembolso já registrado.

**BIA.** Busca full-text em português (`bia_buscar`) nas transcrições das aulas publicadas e nos textos extras do admin, manda só os trechos encontrados para o Claude e mostra de qual aula veio a resposta. Sem trecho, não chama a IA. Cota mensal por aluno; custo registrado em `bia_perguntas`.

## Estrutura

```
src/proxy.ts                         porteiro (login + acesso)
src/app/(aluno)/                     comece-aqui, metodo, comunidade, bia, perfil
src/app/admin/                       painel, alunos, curso, guru, bia, configuracoes
src/app/api/webhooks/guru/route.ts   webhook de vendas
src/lib/guru.ts                      contrato do payload da Guru (troque aqui para outro gateway)
src/lib/guru-processar.ts            aplica o evento no acesso
src/lib/bia/                         prompt, modelo, divisão em trechos
src/components/logo.tsx              SUA LOGO (único lugar para trocar)
src/app/globals.css                  cores (:root)
supabase/instalacao.sql              banco completo
```

## Usar outro gateway

O banco e as telas não dependem da Guru. Para Hotmart, Kiwify, Eduzz etc.:

1. Crie uma rota nova em `src/app/api/webhooks/<gateway>/route.ts` com a validação de assinatura do gateway.
2. Escreva o equivalente de `src/lib/guru.ts`: transformar o payload em `{ referencia, status, origemEm, aprovadoEm, email, nome, produtos }` e mapear os status para `ativo | reembolsado | chargeback | disputa`.
3. Reaproveite `processarEventoGuru` (ou copie a lógica) e a função `aplicar_evento_guru` do banco, que não sabe de qual gateway veio o evento.
4. Libere a rota nova no `matcher` do `src/proxy.ts` (como `api/webhooks` já está).

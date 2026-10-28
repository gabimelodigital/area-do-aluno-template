# Instalação da sua Área do Aluno

Tempo médio: 20 minutos. Você precisa de conta no **GitHub**, no **Supabase** e na **Vercel** (entre na Vercel e no Supabase com o seu GitHub).

No fim, seus alunos compram na Guru, recebem pelo SIV o link + e-mail + senha, e entram direto na área. Reembolso bloqueia sozinho.

---

## Passo 1. Crie o banco no Supabase

1. Em supabase.com, clique em **New project**.
2. Dê um nome, crie uma senha para o banco (guarde num gerenciador de senhas) e em **Region** escolha **South America (São Paulo)**.
3. Em **Security**: deixe **Enable Data API** e **Enable automatic RLS** marcados e **desmarque** **Automatically expose new tables**.
4. Clique em **Create new project** e espere ficar pronto.
5. Deixe aberta a tela **Project Settings** → **API Keys**: no passo 2 você vai copiar dela a **URL do projeto**, a **Publishable key** (começa com `sb_publishable_`) e a **Secret key** (começa com `sb_secret_`). Use a aba **API Keys**, não a **Legacy API Keys**: as chaves antigas parecem iguais e confundem.

## Passo 2. Coloque a área no ar (Vercel)

1. Clique no botão **Deploy** que você recebeu (link de instalação).
2. Entre na Vercel com o seu GitHub. Se pedir, autorize a Vercel no GitHub.
3. Em **Create Git Repository**, deixe o nome `area-do-aluno` e clique em **Create**.
4. Preencha as 5 chaves e clique em **Deploy**:

| Chave | O que colocar |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → **Project Settings** → **Data API** → **URL** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → **API Keys** → **Publishable key** (`sb_publishable_...`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → **API Keys** → **Secret keys** (`sb_secret_...`, clique no olho para revelar). Se não houver, **Create new secret key**. Nunca mostre a ninguém. |
| `EMAIL_DONO` | seu e-mail (você vai entrar na área com ele) |
| `SENHA_PADRAO_ALUNO` | uma senha que você inventa, mínimo 8 caracteres. É a sua senha inicial e a de todo aluno novo. |

5. Espere uns 2 minutos até aparecer **Congratulations**. Clique na miniatura do site para abrir.

## Passo 3. Termine a instalação

1. No endereço do seu site, acrescente `/instalar` (ex.: `https://area-do-aluno-xyz.vercel.app/instalar`) e abra.
2. Clique em **Copiar o código do banco**.
3. Clique no link **Abra o SQL Editor do seu Supabase**, clique no espaço em branco, aperte **Ctrl+V** e clique em **Run**. Deve aparecer **Success**.
4. Volte para a página e clique em **Já rodei, continuar** → **Criar minha conta de dono**.
5. Clique em **Ir para o login** e entre com o seu e-mail e a senha padrão. Troque sua senha em **Meu perfil**.

## Passo 4. Ligue a Guru e a BIA

1. Na Vercel: **Settings** → **Environment Variables** → adicione:
   - `GURU_API_TOKEN`: Guru → seu perfil → **Tokens API**.
   - `ANTHROPIC_API_KEY`: console.anthropic.com → **API Keys** → **Create Key** (é a chave da BIA).
   Depois: **Deployments** → **⋯** → **Redeploy**.
2. Na sua área: **Admin** → **Guru** → copie a **URL do webhook**.
3. Na Guru: **Configurações** → **Webhooks** → crie um webhook novo, cole a URL e marque os eventos de **vendas (transações)**.
4. Na sua área: **Admin** → **Guru** → cadastre o **ID do produto** da Guru e os **dias de acesso** (vazio = vitalício).
5. Faça uma venda de teste (cupom 100%). Em **Admin** → **Guru** → **Vendas recebidas**, ela deve aparecer como **processado**.

## Passo 5. Boas-vindas pelo SIV

A área cria o aluno sozinha; quem avisa o aluno é o seu SIV. Na automação de **compra aprovada** do produto, envie:

> Seu acesso está liberado! 🎉
> Entre em: https://SEU-ENDERECO/login
> E-mail: o mesmo da compra
> Senha: SUA_SENHA_PADRAO
> Depois de entrar, troque a senha em **Meu perfil**.

## Passo 6. Deixe com a sua cara

1. **Admin** → **Configurações**: nome da área, WhatsApp, vídeo e texto do Comece Aqui, cota da BIA.
2. **Admin** → **Curso**: módulos e aulas. Cole a **transcrição** de cada aula: é dela que a BIA tira as respostas.
3. **Admin** → **BIA** → **Textos extras**: perguntas frequentes, suporte, bônus.
4. **Logo e cores**: no GitHub, abra o seu repositório `area-do-aluno`:
   - Logo: arquivo `src/components/logo.tsx` → clique no lápis (**Edit**) e siga o comentário do topo. Envie sua imagem em `public/` (**Add file** → **Upload files**).
   - Cores: `src/app/globals.css`, valores em `:root` (`--primary` é a cor principal, `--brand` a dos botões).
   - Clique em **Commit changes**. A Vercel publica sozinha em ~2 minutos.

---

## Importante: plano da Vercel

O teste grátis da Vercel (Pro Trial) dura alguns dias. Depois, o plano grátis (Hobby) é só para uso **não comercial**. Como a área de membros é comercial, o certo é o plano **Pro**.

## Opcional: "Esqueci minha senha" e link mágico para os alunos

O e-mail padrão do Supabase só envia para a equipe do projeto. Para os alunos receberem os e-mails de recuperação:

1. Crie uma conta no **Resend** (ou outro SMTP), verifique seu domínio e gere uma chave.
2. Supabase → **Authentication** → **Emails** → **SMTP Settings** → ative **Enable Custom SMTP** e preencha com os dados do Resend.
3. Supabase → **Authentication** → **URL Configuration**: em **Site URL** coloque o endereço da sua área e em **Redirect URLs** adicione `https://SEU-ENDERECO/**`.
4. (Recomendado) **Authentication** → **Emails** → **Templates**: nos modelos **Magic Link** e **Reset Password**, troque o link por:
   - Magic Link: `{{ .SiteURL }}/auth/link?token_hash={{ .TokenHash }}&type=email`
   - Reset Password: `{{ .SiteURL }}/auth/link?token_hash={{ .TokenHash }}&type=recovery`

Sem isso, a área funciona normalmente com e-mail + senha padrão.

## Problemas comuns

- **Aluno comprou e não entra**: Admin → Guru → Vendas recebidas. O motivo aparece na linha. O mais comum é produto não cadastrado: cadastre e clique em **Reprocessar**.
- **Aluno cai em "Seu acesso não está ativo"**: houve reembolso, chargeback, o prazo acabou ou você bloqueou. Para liberar na mão: Admin → **Alunos** → **Liberar acesso manual**.
- **BIA responde "ainda não encontrei"**: a aula não tem transcrição ou não está publicada.
- **Mudou chave e nada mudou**: faça **Redeploy** na Vercel.
- **Seu domínio**: na Vercel, **Settings** → **Domains** → **Add**.

-- =============================================================================
-- ÁREA DO ALUNO — instalação do banco (Supabase)
--
-- Como usar: Supabase > SQL Editor > New query > cole este arquivo inteiro > Run.
-- Pode rodar de novo sem medo: o script é idempotente (atualiza o que já existe).
--
-- Modelo de segurança:
--  * RLS ligado em todas as tabelas.
--  * Aluno só enxerga conteúdo se tem_acesso() = true (compra ativa ou liberação
--    manual). Reembolso/chargeback bloqueia na hora, inclusive direto na API.
--  * Admin = profiles.is_admin. Admin sempre tem acesso.
--  * O webhook da Guru usa a service_role (servidor), nunca o navegador.
--  * Erros de regra usam o código padrão P0001 (mensagem vai pro aluno).
--    Nunca usar SQLSTATE 40001: o PostgREST repete a transação sem fim.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. PERFIS
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  nome text check (nome is null or length(nome) <= 120),
  avatar_path text check (avatar_path is null or length(avatar_path) <= 200),
  is_admin boolean not null default false,
  criado_em timestamptz not null default now()
);
create index if not exists profiles_email_idx on public.profiles (email);

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, nome)
  values (
    new.id,
    lower(new.email),
    nullif(btrim(coalesce(new.raw_user_meta_data->>'nome', new.raw_user_meta_data->>'full_name', '')), '')
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Usuários criados antes deste script também ganham perfil.
insert into public.profiles (id, email)
select id, lower(email) from auth.users where email is not null
on conflict (id) do nothing;

create or replace function public.current_user_is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false)
$$;

-- ---------------------------------------------------------------------------
-- 2. ACESSOS (compra na Guru ou liberação manual)
-- ---------------------------------------------------------------------------
create table if not exists public.acessos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  referencia text not null unique,            -- id da transação na Guru, ou manual:<user_id>
  origem text not null check (origem in ('compra', 'manual')),
  produto_id text,
  status text not null check (status in ('ativo', 'reembolsado', 'chargeback', 'disputa', 'revogado')),
  valido_ate timestamptz,                     -- null = vitalício
  revogado_em timestamptz,
  origem_em timestamptz not null default now(), -- data do evento na Guru (ordena eventos fora de ordem)
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index if not exists acessos_user_idx on public.acessos (user_id);

create or replace function public.tem_acesso() returns boolean
language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and (
    public.current_user_is_admin()
    or exists (
      select 1 from public.acessos a
      where a.user_id = auth.uid()
        and a.status = 'ativo'
        and a.revogado_em is null
        and (a.valido_ate is null or a.valido_ate > now())
    )
  )
$$;

-- ---------------------------------------------------------------------------
-- 3. CONFIGURAÇÕES DA ÁREA (não-secretas; editadas em /admin/configuracoes)
-- ---------------------------------------------------------------------------
create table if not exists public.configuracoes (
  id boolean primary key default true check (id),
  nome_area text not null default 'Área do Aluno' check (length(nome_area) between 1 and 80),
  whatsapp_numero text check (whatsapp_numero is null or whatsapp_numero ~ '^[0-9]{10,15}$'),
  whatsapp_mensagem text not null default 'Olá! Vim pela área do aluno e preciso de ajuda.' check (length(whatsapp_mensagem) <= 300),
  comece_titulo text not null default 'Seu primeiro passo' check (length(comece_titulo) <= 120),
  comece_texto text not null default 'Boas-vindas! Assista a este vídeo curto para conhecer a área e começar com um caminho claro.' check (length(comece_texto) <= 600),
  comece_video_url text check (comece_video_url is null or length(comece_video_url) <= 500),
  bia_cota_mensal integer not null default 100 check (bia_cota_mensal between 0 and 10000),
  atualizado_em timestamptz not null default now()
);
insert into public.configuracoes (id) values (true) on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 4. CURSO (Método): módulos > aulas > progresso
-- ---------------------------------------------------------------------------
create table if not exists public.modulos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null check (length(btrim(titulo)) between 1 and 200),
  descricao text check (descricao is null or length(descricao) <= 1000),
  ordem integer not null default 0,
  publicado boolean not null default false,
  criado_em timestamptz not null default now()
);

create table if not exists public.aulas (
  id uuid primary key default gen_random_uuid(),
  modulo_id uuid not null references public.modulos(id) on delete cascade,
  titulo text not null check (length(btrim(titulo)) between 1 and 200),
  descricao text check (descricao is null or length(descricao) <= 2000),
  video_url text check (video_url is null or length(video_url) <= 500),
  materiais jsonb not null default '[]'::jsonb check (jsonb_typeof(materiais) = 'array'),
  transcricao text check (transcricao is null or length(transcricao) <= 200000),
  ordem integer not null default 0,
  publicado boolean not null default false,
  criado_em timestamptz not null default now()
);
create index if not exists aulas_modulo_idx on public.aulas (modulo_id, ordem);

-- Linha existe = aula concluída.
create table if not exists public.aula_progresso (
  user_id uuid not null references auth.users(id) on delete cascade,
  aula_id uuid not null references public.aulas(id) on delete cascade,
  concluida_em timestamptz not null default now(),
  primary key (user_id, aula_id)
);

-- ---------------------------------------------------------------------------
-- 5. COMUNIDADE (acesso só pelas funções app_comunidade_*)
-- ---------------------------------------------------------------------------
create table if not exists public.comunidade_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  canal text not null check (canal in ('apresente-se', 'geral', 'avisos')),
  titulo text not null check (length(titulo) between 1 and 200),
  corpo text not null check (length(corpo) between 1 and 10000),
  fixado boolean not null default false,
  criado_em timestamptz not null default now()
);
create index if not exists comunidade_posts_canal_idx on public.comunidade_posts (canal, fixado desc, criado_em desc);

create table if not exists public.comunidade_respostas (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.comunidade_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  corpo text not null check (length(corpo) between 1 and 10000),
  criado_em timestamptz not null default now()
);
create index if not exists comunidade_respostas_post_idx on public.comunidade_respostas (post_id, criado_em);

create table if not exists public.comunidade_reacoes (
  post_id uuid not null references public.comunidade_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  emoji text not null check (emoji in ('👍', '❤️', '🔥', '🎉', '🙌')),
  primary key (post_id, user_id, emoji)
);

-- ---------------------------------------------------------------------------
-- 6. BIA (busca nas transcrições das aulas + textos extras)
-- ---------------------------------------------------------------------------
create table if not exists public.bia_fontes (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('aula', 'texto')),
  aula_id uuid unique references public.aulas(id) on delete cascade,
  titulo text not null check (length(titulo) between 1 and 200),
  texto text check (texto is null or length(texto) <= 200000), -- original dos textos extras (pra editar)
  atualizado_em timestamptz not null default now(),
  check ((tipo = 'aula') = (aula_id is not null))
);

create table if not exists public.bia_trechos (
  id bigint generated always as identity primary key,
  fonte_id uuid not null references public.bia_fontes(id) on delete cascade,
  ordem integer not null,
  conteudo text not null check (length(conteudo) <= 2000)
);
create index if not exists bia_trechos_fonte_idx on public.bia_trechos (fonte_id, ordem);
create index if not exists bia_trechos_fts_idx on public.bia_trechos using gin (to_tsvector('portuguese'::regconfig, conteudo));

create table if not exists public.bia_perguntas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  criado_em timestamptz not null default now(),
  status text not null default 'pendente' check (status in ('pendente', 'concluida', 'falha')),
  modelo text,
  tokens_entrada integer,
  tokens_saida integer,
  custo_usd numeric(12, 6)
);
create index if not exists bia_perguntas_user_idx on public.bia_perguntas (user_id, criado_em);

-- ---------------------------------------------------------------------------
-- 7. GURU (produtos que liberam acesso + log de eventos do webhook)
-- ---------------------------------------------------------------------------
create table if not exists public.guru_produtos (
  id uuid primary key default gen_random_uuid(),
  produto_id text not null unique check (length(btrim(produto_id)) between 1 and 191),
  nome text not null check (length(btrim(nome)) between 1 and 200),
  dias_acesso integer check (dias_acesso is null or dias_acesso between 1 and 36500), -- null = vitalício
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

create table if not exists public.guru_eventos (
  id uuid primary key default gen_random_uuid(),
  chave text not null unique,                 -- idempotência: o mesmo evento nunca é aplicado 2x
  referencia text,
  status text,
  email text,
  payload jsonb not null,                     -- corpo recebido, sem o api_token
  resultado text not null default 'recebido' check (resultado in ('recebido', 'processado', 'ignorado', 'erro')),
  detalhe text,
  criado_em timestamptz not null default now(),
  processado_em timestamptz
);
create index if not exists guru_eventos_criado_idx on public.guru_eventos (criado_em desc);

-- Aplica um evento financeiro da Guru no acesso do aluno, de forma atômica.
-- Ignora evento mais antigo que o último aplicado na mesma transação, e uma
-- aprovação nunca desfaz reembolso/chargeback já registrado.
create or replace function public.aplicar_evento_guru(
  p_user_id uuid, p_referencia text, p_produto_id text, p_situacao text,
  p_origem_em timestamptz, p_aprovado_em timestamptz, p_dias integer
) returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_atual public.acessos%rowtype;
  v_prioridade constant jsonb := '{"ativo":1,"disputa":2,"reembolsado":3,"chargeback":4}';
begin
  if p_situacao not in ('ativo', 'reembolsado', 'chargeback', 'disputa') then
    raise exception 'Situação inválida: %', p_situacao using errcode = '22023';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('guru:' || p_referencia));
  select * into v_atual from public.acessos where referencia = p_referencia for update;
  if found then
    if v_atual.origem_em > p_origem_em
       or (v_atual.origem_em = p_origem_em
           and (v_prioridade->>v_atual.status)::int >= (v_prioridade->>p_situacao)::int)
       or (p_situacao = 'ativo' and v_atual.status in ('reembolsado', 'chargeback')) then
      return 'evento antigo, ignorado';
    end if;
  end if;

  if p_situacao = 'ativo' then
    insert into public.acessos (user_id, referencia, origem, produto_id, status, valido_ate, revogado_em, origem_em)
    values (p_user_id, p_referencia, 'compra', p_produto_id, 'ativo',
            case when p_dias is null then null else coalesce(p_aprovado_em, p_origem_em) + make_interval(days => p_dias) end,
            null, p_origem_em)
    on conflict (referencia) do update set
      status = 'ativo', valido_ate = excluded.valido_ate, revogado_em = null,
      produto_id = excluded.produto_id, origem_em = excluded.origem_em, atualizado_em = now();
    return 'acesso liberado';
  end if;

  insert into public.acessos (user_id, referencia, origem, produto_id, status, revogado_em, origem_em)
  values (p_user_id, p_referencia, 'compra', p_produto_id, p_situacao, now(), p_origem_em)
  on conflict (referencia) do update set
    status = excluded.status, revogado_em = coalesce(public.acessos.revogado_em, now()),
    origem_em = excluded.origem_em, atualizado_em = now();
  return 'acesso bloqueado (' || p_situacao || ')';
end $$;

-- ---------------------------------------------------------------------------
-- 8. FUNÇÕES DA COMUNIDADE
-- ---------------------------------------------------------------------------
create or replace function public.app_comunidade_validar_texto(p_texto text) returns void
language plpgsql set search_path = '' as $$
declare t text := lower(coalesce(p_texto, ''));
begin
  if t ~ '(https?\s*:|www\s*\.|javascript\s*:|data\s*:|<\s*/?\s*[a-z!]|```|on(error|load|click)\s*=)'
     or t ~ '([a-z0-9-]+\.)+(com|br|net|org|io|app|gg|me|xyz|online|site)([^a-z]|$)' then
    raise exception 'Links e código não são permitidos na comunidade. Envie sua mensagem em texto.';
  end if;
  if t ~ '\m(puta|porra|caralho|foda-se|fodase|merda|fdp|pqp)\M' then
    raise exception 'Revise a mensagem: linguagem ofensiva não é permitida.';
  end if;
end $$;

create or replace function public.app_comunidade_exigir_acesso() returns void
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.tem_acesso() then raise exception 'Seu acesso não está ativo.'; end if;
end $$;

create or replace function public.app_comunidade(p_canal text default 'geral', p_post_id uuid default null, p_offset integer default 0)
returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare v_posts jsonb; v_respostas jsonb; v_total integer;
begin
  perform public.app_comunidade_exigir_acesso();
  if p_post_id is null and (p_canal is null or p_canal not in ('apresente-se', 'geral', 'avisos')) then
    raise exception 'Canal inválido.';
  end if;

  select count(*) into v_total from public.comunidade_posts p
  where (p_post_id is not null and p.id = p_post_id) or (p_post_id is null and p.canal = p_canal);

  select coalesce(jsonb_agg(to_jsonb(q) order by q.fixado desc, q.criado_em desc, q.id), '[]'::jsonb) into v_posts
  from (
    select p.id, p.user_id, p.canal, p.titulo, p.corpo, p.fixado, p.criado_em,
      (select count(*) from public.comunidade_respostas r where r.post_id = p.id) as total_respostas,
      jsonb_build_object('id', a.id, 'nome', nullif(btrim(a.nome), ''), 'is_admin', coalesce(a.is_admin, false), 'avatar', a.avatar_path) as autor,
      coalesce((select jsonb_agg(jsonb_build_object('user_id', x.user_id, 'emoji', x.emoji))
                from public.comunidade_reacoes x where x.post_id = p.id), '[]'::jsonb) as reacoes
    from public.comunidade_posts p
    left join public.profiles a on a.id = p.user_id
    where (p_post_id is not null and p.id = p_post_id) or (p_post_id is null and p.canal = p_canal)
    order by p.fixado desc, p.criado_em desc, p.id
    limit 50 offset greatest(0, coalesce(p_offset, 0))
  ) q;

  select coalesce(jsonb_agg(to_jsonb(q) order by q.criado_em, q.id), '[]'::jsonb) into v_respostas
  from (
    select r.id, r.user_id, r.corpo, r.criado_em,
      jsonb_build_object('id', a.id, 'nome', nullif(btrim(a.nome), ''), 'is_admin', coalesce(a.is_admin, false), 'avatar', a.avatar_path) as autor
    from public.comunidade_respostas r
    left join public.profiles a on a.id = r.user_id
    where p_post_id is not null and r.post_id = p_post_id
  ) q;

  return jsonb_build_object('posts', v_posts, 'respostas', v_respostas, 'total', v_total,
                            'is_admin', public.current_user_is_admin());
end $$;

create or replace function public.app_comunidade_criar_post(p_canal text, p_titulo text, p_corpo text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  perform public.app_comunidade_exigir_acesso();
  if p_canal is null or p_canal not in ('apresente-se', 'geral', 'avisos') then raise exception 'Canal inválido.'; end if;
  if p_canal = 'avisos' and not public.current_user_is_admin() then
    raise exception 'Somente a equipe pode publicar em Avisos.';
  end if;
  if coalesce(length(btrim(p_titulo)), 0) not between 1 and 200 or coalesce(length(btrim(p_corpo)), 0) not between 1 and 10000 then
    raise exception 'Preencha o título (até 200 caracteres) e a mensagem (até 10.000 caracteres).';
  end if;
  perform public.app_comunidade_validar_texto(p_titulo || E'\n' || p_corpo);
  insert into public.comunidade_posts (user_id, canal, titulo, corpo)
  values (auth.uid(), p_canal, btrim(p_titulo), btrim(p_corpo)) returning id into v_id;
  return v_id;
end $$;

create or replace function public.app_comunidade_responder(p_post_id uuid, p_corpo text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  perform public.app_comunidade_exigir_acesso();
  if coalesce(length(btrim(p_corpo)), 0) not between 1 and 10000 then
    raise exception 'Escreva uma resposta de até 10.000 caracteres.';
  end if;
  perform 1 from public.comunidade_posts where id = p_post_id for key share;
  if not found then raise exception 'Este post não está mais disponível.'; end if;
  perform public.app_comunidade_validar_texto(p_corpo);
  insert into public.comunidade_respostas (post_id, user_id, corpo)
  values (p_post_id, auth.uid(), btrim(p_corpo)) returning id into v_id;
  return v_id;
end $$;

create or replace function public.app_comunidade_apagar(p_id uuid, p_tipo text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.app_comunidade_exigir_acesso();
  if p_tipo = 'post' then
    delete from public.comunidade_posts where id = p_id and (user_id = auth.uid() or public.current_user_is_admin());
  elsif p_tipo = 'resposta' then
    delete from public.comunidade_respostas where id = p_id and (user_id = auth.uid() or public.current_user_is_admin());
  else
    raise exception 'Tipo inválido.';
  end if;
  if not found then raise exception 'Mensagem não encontrada ou você não pode apagá-la.'; end if;
end $$;

create or replace function public.app_comunidade_reagir(p_post_id uuid, p_emoji text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.app_comunidade_exigir_acesso();
  if p_emoji is null or p_emoji not in ('👍', '❤️', '🔥', '🎉', '🙌') then raise exception 'Reação inválida.'; end if;
  -- Serializa cliques simultâneos no mesmo post.
  perform 1 from public.comunidade_posts where id = p_post_id for update;
  if not found then raise exception 'Este post não está mais disponível.'; end if;
  delete from public.comunidade_reacoes where post_id = p_post_id and user_id = auth.uid() and emoji = p_emoji;
  if not found then
    insert into public.comunidade_reacoes (post_id, user_id, emoji) values (p_post_id, auth.uid(), p_emoji);
  end if;
end $$;

create or replace function public.app_comunidade_fixar(p_id uuid, p_fixado boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.current_user_is_admin() then raise exception 'Somente a equipe pode fixar mensagens.'; end if;
  update public.comunidade_posts set fixado = coalesce(p_fixado, false) where id = p_id;
  if not found then raise exception 'Post não encontrado.'; end if;
end $$;

-- ---------------------------------------------------------------------------
-- 9. FUNÇÕES DA BIA
-- ---------------------------------------------------------------------------
-- Busca full-text em português. Prioriza trechos que cobrem todos os termos;
-- só cai pra correspondência parcial quando não há resultado completo.
create or replace function public.bia_buscar(p_pergunta text, p_limite integer default 8)
returns table (conteudo text, fonte_tipo text, fonte_titulo text, aula_id uuid, modulo_id uuid, similaridade real)
language plpgsql stable security definer set search_path = '' as $$
declare v_termos text; v_query_or tsquery; v_query_and tsquery;
begin
  if not public.tem_acesso() then raise exception 'Seu acesso não está ativo.'; end if;
  if length(btrim(coalesce(p_pergunta, ''))) < 3 then return; end if;
  select string_agg(q::text, ' | ') into v_termos
  from (
    select distinct pg_catalog.plainto_tsquery('portuguese'::regconfig, palavra) q
    from regexp_split_to_table(left(p_pergunta, 600), '[^[:alnum:]]+') palavra
    where length(palavra) > 2
  ) termos where q <> ''::tsquery;
  if v_termos is null then return; end if;
  v_query_or := v_termos::tsquery;
  v_query_and := pg_catalog.plainto_tsquery('portuguese'::regconfig, left(p_pergunta, 600));

  return query
  with candidatos as materialized (
    select t.conteudo, f.tipo, f.titulo, f.aula_id, a.modulo_id, t.ordem,
      to_tsvector('portuguese'::regconfig, t.conteudo) as vetor
    from public.bia_trechos t
    join public.bia_fontes f on f.id = t.fonte_id
    left join public.aulas a on a.id = f.aula_id
    left join public.modulos m on m.id = a.modulo_id
    where to_tsvector('portuguese'::regconfig, t.conteudo) @@ v_query_or
      and (f.tipo = 'texto' or (a.publicado and m.publicado))
  )
  select c.conteudo, c.tipo, c.titulo, c.aula_id, c.modulo_id, ts_rank_cd(c.vetor, v_query_or)::real
  from candidatos c
  where c.vetor @@ v_query_and
     or not exists (select 1 from candidatos c2 where c2.vetor @@ v_query_and)
  order by ts_rank_cd(c.vetor, v_query_or) desc, c.titulo, c.ordem
  limit least(greatest(coalesce(p_limite, 8), 1), 12);
end $$;

-- Reserva uma pergunta dentro da cota mensal (fuso de São Paulo).
-- Pergunta que falha não consome cota. Admin não tem limite.
create or replace function public.bia_reservar_pergunta() returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_usuario uuid := auth.uid(); v_inicio timestamptz; v_cota integer; v_usadas integer; v_id uuid;
begin
  if not public.tem_acesso() then raise exception 'Seu acesso não está ativo.'; end if;
  v_inicio := date_trunc('month', now() at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo';
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('bia:' || v_usuario::text));
  if not public.current_user_is_admin() then
    select bia_cota_mensal into v_cota from public.configuracoes where id;
    select count(*) into v_usadas from public.bia_perguntas
    where user_id = v_usuario and criado_em >= v_inicio
      and (status = 'concluida' or (status = 'pendente' and criado_em > now() - interval '2 minutes'));
    if v_usadas >= coalesce(v_cota, 0) then
      raise exception 'Você chegou ao limite de % perguntas neste mês. A cota renova no próximo mês.', coalesce(v_cota, 0);
    end if;
  end if;
  insert into public.bia_perguntas (user_id) values (v_usuario) returning id into v_id;
  return v_id;
end $$;

create or replace function public.bia_finalizar_pergunta(
  p_id uuid, p_sucesso boolean, p_modelo text default null,
  p_tokens_entrada integer default null, p_tokens_saida integer default null, p_custo_usd numeric default null
) returns void
language plpgsql security definer set search_path = '' as $$
begin
  update public.bia_perguntas set
    status = case when p_sucesso then 'concluida' else 'falha' end,
    modelo = left(p_modelo, 100), tokens_entrada = p_tokens_entrada,
    tokens_saida = p_tokens_saida, custo_usd = p_custo_usd
  where id = p_id and user_id = auth.uid() and status = 'pendente';
end $$;

-- Admin: (re)indexa uma fonte. Para aula, a chave é aula_id; para texto, p_id.
-- p_trechos vazio em aula = remove a aula da base da BIA.
create or replace function public.bia_indexar(
  p_tipo text, p_id uuid, p_aula_id uuid, p_titulo text, p_texto text, p_trechos text[]
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if not public.current_user_is_admin() then raise exception 'Somente admin.'; end if;
  if p_tipo = 'aula' then
    if coalesce(array_length(p_trechos, 1), 0) = 0 then
      delete from public.bia_fontes where aula_id = p_aula_id;
      return null;
    end if;
    insert into public.bia_fontes (tipo, aula_id, titulo) values ('aula', p_aula_id, left(btrim(p_titulo), 200))
    on conflict (aula_id) do update set titulo = excluded.titulo, atualizado_em = now()
    returning id into v_id;
  elsif p_tipo = 'texto' then
    if coalesce(length(btrim(p_titulo)), 0) = 0 then raise exception 'Dê um título ao texto.'; end if;
    if p_id is null then
      insert into public.bia_fontes (tipo, titulo, texto) values ('texto', left(btrim(p_titulo), 200), p_texto)
      returning id into v_id;
    else
      update public.bia_fontes set titulo = left(btrim(p_titulo), 200), texto = p_texto, atualizado_em = now()
      where id = p_id and tipo = 'texto' returning id into v_id;
      if v_id is null then raise exception 'Texto não encontrado.'; end if;
    end if;
  else
    raise exception 'Tipo inválido.';
  end if;
  delete from public.bia_trechos where fonte_id = v_id;
  insert into public.bia_trechos (fonte_id, ordem, conteudo)
  select v_id, ord - 1, left(trecho, 2000) from unnest(p_trechos) with ordinality as u(trecho, ord)
  where length(btrim(trecho)) > 0;
  return v_id;
end $$;

create or replace function public.bia_resumo_uso() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare v_inicio timestamptz;
begin
  if not public.current_user_is_admin() then raise exception 'Somente admin.'; end if;
  v_inicio := date_trunc('month', now() at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo';
  return (
    select jsonb_build_object(
      'perguntas', count(*) filter (where status = 'concluida'),
      'falhas', count(*) filter (where status = 'falha'),
      'alunos', count(distinct user_id) filter (where status = 'concluida'),
      'custo_usd', coalesce(sum(custo_usd), 0),
      'trechos', (select count(*) from public.bia_trechos),
      'fontes', (select count(*) from public.bia_fontes)
    )
    from public.bia_perguntas where criado_em >= v_inicio
  );
end $$;

-- ---------------------------------------------------------------------------
-- 10. FUNÇÕES DO ADMIN
-- ---------------------------------------------------------------------------
create or replace function public.admin_listar_alunos(p_busca text default null)
returns table (id uuid, email text, nome text, is_admin boolean, criado_em timestamptz,
               acesso_ativo boolean, valido_ate timestamptz, origem text)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.current_user_is_admin() then raise exception 'Somente admin.'; end if;
  return query
  select p.id, p.email, p.nome, p.is_admin, p.criado_em,
    exists (select 1 from public.acessos a where a.user_id = p.id and a.status = 'ativo' and a.revogado_em is null
            and (a.valido_ate is null or a.valido_ate > now())) as acesso_ativo,
    (select case when bool_or(a.valido_ate is null) then null else max(a.valido_ate) end
       from public.acessos a where a.user_id = p.id and a.status = 'ativo' and a.revogado_em is null) as valido_ate,
    (select a.origem from public.acessos a where a.user_id = p.id order by a.atualizado_em desc limit 1) as origem
  from public.profiles p
  where p_busca is null or btrim(p_busca) = ''
     or p.email ilike '%' || btrim(p_busca) || '%' or p.nome ilike '%' || btrim(p_busca) || '%'
  order by p.criado_em desc
  limit 200;
end $$;

-- Libera (ou renova) acesso manual. p_dias null = vitalício.
create or replace function public.admin_liberar_acesso(p_user_id uuid, p_dias integer default null) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.current_user_is_admin() then raise exception 'Somente admin.'; end if;
  if p_dias is not null and p_dias not between 1 and 36500 then raise exception 'Dias de acesso inválidos.'; end if;
  insert into public.acessos (user_id, referencia, origem, status, valido_ate)
  values (p_user_id, 'manual:' || p_user_id, 'manual', 'ativo',
          case when p_dias is null then null else now() + make_interval(days => p_dias) end)
  on conflict (referencia) do update set status = 'ativo', revogado_em = null,
    valido_ate = excluded.valido_ate, atualizado_em = now();
end $$;

-- Bloqueia todos os acessos ativos do aluno (compra e manual).
create or replace function public.admin_revogar_acessos(p_user_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.current_user_is_admin() then raise exception 'Somente admin.'; end if;
  if p_user_id = auth.uid() then raise exception 'Você não pode bloquear a própria conta.'; end if;
  update public.acessos set status = 'revogado', revogado_em = now(), atualizado_em = now()
  where user_id = p_user_id and revogado_em is null;
end $$;

-- ---------------------------------------------------------------------------
-- 11. RLS E PERMISSÕES
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.acessos enable row level security;
alter table public.configuracoes enable row level security;
alter table public.modulos enable row level security;
alter table public.aulas enable row level security;
alter table public.aula_progresso enable row level security;
alter table public.comunidade_posts enable row level security;
alter table public.comunidade_respostas enable row level security;
alter table public.comunidade_reacoes enable row level security;
alter table public.bia_fontes enable row level security;
alter table public.bia_trechos enable row level security;
alter table public.bia_perguntas enable row level security;
alter table public.guru_produtos enable row level security;
alter table public.guru_eventos enable row level security;

-- Zera permissões e concede só o necessário (independe dos padrões do projeto).
revoke all on public.profiles, public.acessos, public.configuracoes, public.modulos, public.aulas,
  public.aula_progresso, public.comunidade_posts, public.comunidade_respostas, public.comunidade_reacoes,
  public.bia_fontes, public.bia_trechos, public.bia_perguntas, public.guru_produtos, public.guru_eventos
  from anon, authenticated;

grant select on public.configuracoes to anon, authenticated;
grant update (nome_area, whatsapp_numero, whatsapp_mensagem, comece_titulo, comece_texto,
              comece_video_url, bia_cota_mensal, atualizado_em) on public.configuracoes to authenticated;
grant select on public.profiles to authenticated;
grant update (nome, avatar_path) on public.profiles to authenticated;
grant select on public.acessos to authenticated;
grant select, insert, update, delete on public.modulos, public.aulas to authenticated;
grant select, insert, delete on public.aula_progresso to authenticated;
grant select, delete on public.bia_fontes to authenticated;
grant select, insert, update, delete on public.guru_produtos to authenticated;
grant select on public.guru_eventos to authenticated;
-- Servidor (webhook e criação de alunos).
grant select, insert, update on public.profiles, public.acessos, public.guru_eventos to service_role;
grant select on public.guru_produtos, public.configuracoes to service_role;

drop policy if exists configuracoes_ler on public.configuracoes;
create policy configuracoes_ler on public.configuracoes for select to anon, authenticated using (true);
drop policy if exists configuracoes_admin on public.configuracoes;
create policy configuracoes_admin on public.configuracoes for update to authenticated
  using (public.current_user_is_admin()) with check (public.current_user_is_admin());

drop policy if exists profiles_ler on public.profiles;
create policy profiles_ler on public.profiles for select to authenticated
  using (id = auth.uid() or public.current_user_is_admin());
drop policy if exists profiles_editar on public.profiles;
create policy profiles_editar on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists acessos_ler on public.acessos;
create policy acessos_ler on public.acessos for select to authenticated
  using (user_id = auth.uid() or public.current_user_is_admin());

drop policy if exists modulos_ler on public.modulos;
create policy modulos_ler on public.modulos for select to authenticated
  using (public.current_user_is_admin() or (publicado and public.tem_acesso()));
drop policy if exists modulos_admin on public.modulos;
create policy modulos_admin on public.modulos for all to authenticated
  using (public.current_user_is_admin()) with check (public.current_user_is_admin());

drop policy if exists aulas_ler on public.aulas;
create policy aulas_ler on public.aulas for select to authenticated
  using (public.current_user_is_admin() or (publicado and public.tem_acesso()
         and exists (select 1 from public.modulos m where m.id = modulo_id and m.publicado)));
drop policy if exists aulas_admin on public.aulas;
create policy aulas_admin on public.aulas for all to authenticated
  using (public.current_user_is_admin()) with check (public.current_user_is_admin());

drop policy if exists progresso_proprio on public.aula_progresso;
create policy progresso_proprio on public.aula_progresso for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid() and public.tem_acesso());

drop policy if exists bia_fontes_admin on public.bia_fontes;
create policy bia_fontes_admin on public.bia_fontes for all to authenticated
  using (public.current_user_is_admin()) with check (public.current_user_is_admin());

drop policy if exists guru_produtos_admin on public.guru_produtos;
create policy guru_produtos_admin on public.guru_produtos for all to authenticated
  using (public.current_user_is_admin()) with check (public.current_user_is_admin());
drop policy if exists guru_eventos_admin on public.guru_eventos;
create policy guru_eventos_admin on public.guru_eventos for select to authenticated
  using (public.current_user_is_admin());

-- Funções: ninguém executa por padrão; libera explicitamente.
revoke all on function
  public.handle_new_user(), public.current_user_is_admin(), public.tem_acesso(),
  public.aplicar_evento_guru(uuid, text, text, text, timestamptz, timestamptz, integer),
  public.app_comunidade_validar_texto(text), public.app_comunidade_exigir_acesso(),
  public.app_comunidade(text, uuid, integer), public.app_comunidade_criar_post(text, text, text),
  public.app_comunidade_responder(uuid, text), public.app_comunidade_apagar(uuid, text),
  public.app_comunidade_reagir(uuid, text), public.app_comunidade_fixar(uuid, boolean),
  public.bia_buscar(text, integer), public.bia_reservar_pergunta(),
  public.bia_finalizar_pergunta(uuid, boolean, text, integer, integer, numeric),
  public.bia_indexar(text, uuid, uuid, text, text, text[]), public.bia_resumo_uso(),
  public.admin_listar_alunos(text), public.admin_liberar_acesso(uuid, integer), public.admin_revogar_acessos(uuid)
  from public, anon, authenticated;

grant execute on function
  public.current_user_is_admin(), public.tem_acesso(),
  public.app_comunidade(text, uuid, integer), public.app_comunidade_criar_post(text, text, text),
  public.app_comunidade_responder(uuid, text), public.app_comunidade_apagar(uuid, text),
  public.app_comunidade_reagir(uuid, text), public.app_comunidade_fixar(uuid, boolean),
  public.bia_buscar(text, integer), public.bia_reservar_pergunta(),
  public.bia_finalizar_pergunta(uuid, boolean, text, integer, integer, numeric),
  public.bia_indexar(text, uuid, uuid, text, text, text[]), public.bia_resumo_uso(),
  public.admin_listar_alunos(text), public.admin_liberar_acesso(uuid, integer), public.admin_revogar_acessos(uuid)
  to authenticated;
grant execute on function
  public.aplicar_evento_guru(uuid, text, text, text, timestamptz, timestamptz, integer)
  to service_role;

-- ---------------------------------------------------------------------------
-- 12. STORAGE: fotos de perfil (bucket privado, URLs assinadas)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatares', 'avatares', false, 819200, array['image/jpeg'])
on conflict (id) do update set public = false, file_size_limit = 819200, allowed_mime_types = array['image/jpeg'];

drop policy if exists avatares_ler on storage.objects;
create policy avatares_ler on storage.objects for select to authenticated
  using (bucket_id = 'avatares');
drop policy if exists avatares_enviar on storage.objects;
create policy avatares_enviar on storage.objects for insert to authenticated
  with check (bucket_id = 'avatares' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists avatares_apagar on storage.objects;
create policy avatares_apagar on storage.objects for delete to authenticated
  using (bucket_id = 'avatares' and (storage.foldername(name))[1] = auth.uid()::text);

-- Fim. Próximo passo: criar seu usuário e virar admin (ver INSTALACAO.md).

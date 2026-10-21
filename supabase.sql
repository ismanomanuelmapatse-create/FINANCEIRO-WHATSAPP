-- Duas tabelas, uma por fluxo do n8n. As colunas têm os mesmos nomes do JSON,
-- por isso o nó Supabase (Insert) pode mandar o objeto tal como sai do bot.

-- Fluxo 1: recebimentos (objeto "dados_financeiros")
create table if not exists public.receitas (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  tipo_movimento text not null default 'receita',
  valor numeric(14,2),
  moeda text not null default 'MZN',
  descricao text,
  categoria text,
  fonte text,
  destino text,
  conta_movimento text,
  valor_pago numeric(14,2),
  troco_recebido numeric(14,2),
  data_movimento date,
  informacoes_em_falta text[] not null default '{}',
  registo_completo boolean not null default false,
  resposta_usuario text      -- vem de "resposta_usuario", fora de dados_financeiros
);

-- Fluxo 2: despesas
create table if not exists public.despesas (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  valor_gasto numeric(14,2),
  descricao_despesa text,
  local_compra text,
  valor_pago numeric(14,2),
  troco_recebido numeric(14,2),
  moeda text not null default 'MZN',
  data_despesa date,
  categoria text,
  informacoes_em_falta text[] not null default '{}',
  pergunta_ao_usuario text,
  registo_completo boolean not null default false
);

create index if not exists receitas_created_idx on public.receitas (created_at desc);
create index if not exists despesas_created_idx on public.despesas (created_at desc);

-- O painel lê com a service_role (servidor). Sem policies = ninguém mais lê.
alter table public.receitas enable row level security;
alter table public.despesas enable row level security;

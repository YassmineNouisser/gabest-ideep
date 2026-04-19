-- ============================================================
-- GABEST · Console admin · Table platform_users
-- ------------------------------------------------------------
-- À exécuter UNE FOIS dans le SQL Editor de Supabase :
-- https://app.supabase.com → projet → SQL Editor → New query
-- ============================================================

-- 1) Enums rôles & statuts -----------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('farmer', 'industry', 'recycling', 'admin');
  end if;
  if not exists (select 1 from pg_type where typname = 'user_status') then
    create type public.user_status as enum ('active', 'pending', 'suspended');
  end if;
end$$;

-- 2) Table principale ---------------------------------------------------
create table if not exists public.platform_users (
  id          uuid                primary key default gen_random_uuid(),
  created_at  timestamptz         not null default now(),
  name        text                not null,
  email       text                not null unique,
  role        public.user_role    not null default 'farmer',
  status      public.user_status  not null default 'pending',
  zone        text                not null default '—',
  volume      text                not null default '—',
  joined      date                not null default current_date
);

create index if not exists platform_users_role_idx   on public.platform_users (role);
create index if not exists platform_users_status_idx on public.platform_users (status);
create index if not exists platform_users_created_idx on public.platform_users (created_at desc);

-- 3) RLS : l'anon peut tout faire (console admin) -----------------------
alter table public.platform_users enable row level security;

drop policy if exists "anon read"   on public.platform_users;
drop policy if exists "anon insert" on public.platform_users;
drop policy if exists "anon update" on public.platform_users;
drop policy if exists "anon delete" on public.platform_users;

create policy "anon read"   on public.platform_users for select using (true);
create policy "anon insert" on public.platform_users for insert with check (true);
create policy "anon update" on public.platform_users for update using (true) with check (true);
create policy "anon delete" on public.platform_users for delete using (true);

-- 4) Realtime -----------------------------------------------------------
do $$
begin
  begin
    alter publication supabase_realtime add table public.platform_users;
  exception when duplicate_object then null;
  end;
end$$;

-- 5) Seed (lots réels de la région Gabès) -------------------------------
insert into public.platform_users (name, email, role, status, zone, volume, joined) values
  ('Hassen Ferchichi',          'hassen@chenini.tn',          'farmer',    'active',    'Chenini Nahal', '12,4 ha',     '2025-11-12'),
  ('Coop. Oléicole Chenini',    'contact@coop-chenini.tn',    'farmer',    'active',    'Chenini',       '38 t/trim.',  '2025-09-04'),
  ('Ferme El Hamma Nord',       'elhamma.nord@gabest.tn',     'farmer',    'pending',   'El Hamma',      '22 t/trim.',  '2026-03-28'),
  ('GCT Ghannouch',             'ops@gct.tn',                 'industry',  'active',    'Ghannouch',     '180 t/mois',  '2025-06-18'),
  ('Cimenterie de Gabès',       'prod@cim-gabes.tn',          'industry',  'active',    'Gabès Sud',     '92 t/mois',   '2025-08-02'),
  ('Chimie Gabès SA',           'qhse@chimie-gabes.tn',       'industry',  'suspended', 'Ghannouch',     '46 t/mois',   '2025-07-15'),
  ('EcoFlow Recycling',         'ops@ecoflow.tn',             'recycling', 'active',    'Gabès Nord',    '48 t/mois',   '2025-10-22'),
  ('Valoris Sud',               'hello@valoris-sud.tn',       'recycling', 'active',    'Mareth',        '26 t/mois',   '2025-12-01'),
  ('GDA Mareth Sud',            'gda.mareth@gabest.tn',       'farmer',    'active',    'Mareth',        '14 t/trim.',  '2025-11-28'),
  ('Agroalimentaire Métouia',   'contact@agro-metouia.tn',    'industry',  'pending',   'Métouia',       '—',           '2026-04-02'),
  ('Palmeraie Ouedhref',        'palmeraie@ouedhref.tn',      'farmer',    'active',    'Ouedhref',      '18 t/trim.',  '2025-10-03'),
  ('Recyclo Phosphate',         'contact@recyclo-p.tn',       'recycling', 'pending',   'Ghannouch',     '—',           '2026-04-10'),
  ('Super Admin',               'admin@gabest.tn',            'admin',     'active',    'Gabest · Plateforme', '—',    '2025-05-01')
on conflict (email) do nothing;

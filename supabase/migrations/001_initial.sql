-- BeautyOS — Initial Schema

create extension if not exists "uuid-ossp";

-- Салоны
create table salons (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  owner_email text,
  crm_type text default 'csv',
  created_at timestamptz default now()
);

-- Клиенты
create table clients (
  id uuid primary key default uuid_generate_v4(),
  salon_id uuid references salons(id) on delete cascade not null,
  external_id text,
  name text not null,
  phone text,
  first_visit_date date,
  last_visit_date date,
  total_visits integer default 0,
  total_revenue numeric(12,2) default 0,
  avg_check numeric(10,2) default 0,
  avg_interval_days numeric(6,1) default 0,
  status text check (status in ('active','at_risk','lost')) default 'active',
  risk_score numeric(4,3) default 0,
  return_score numeric(4,3) default 0,
  revenue_opportunity integer default 0,
  days_since_last_visit integer default 0,
  updated_at timestamptz default now(),
  created_at timestamptz default now(),
  unique(salon_id, phone)
);

create index idx_clients_salon_status on clients(salon_id, status);
create index idx_clients_salon_risk on clients(salon_id, risk_score desc);

-- Визиты
create table visits (
  id uuid primary key default uuid_generate_v4(),
  salon_id uuid references salons(id) on delete cascade not null,
  client_id uuid references clients(id) on delete cascade not null,
  master_name text,
  service_name text,
  visit_date date not null,
  amount numeric(10,2) default 0,
  created_at timestamptz default now()
);

create index idx_visits_client on visits(client_id, visit_date desc);
create index idx_visits_salon_date on visits(salon_id, visit_date desc);

-- Мастера (агрегаты, пересчитываются при каждом анализе)
create table masters (
  id uuid primary key default uuid_generate_v4(),
  salon_id uuid references salons(id) on delete cascade not null,
  name text not null,
  retention_rate numeric(5,4) default 0,
  avg_check numeric(10,2) default 0,
  total_revenue numeric(12,2) default 0,
  active_clients_count integer default 0,
  at_risk_clients_count integer default 0,
  lost_clients_count integer default 0,
  updated_at timestamptz default now(),
  unique(salon_id, name)
);

-- AI-инсайты
create table insights (
  id uuid primary key default uuid_generate_v4(),
  salon_id uuid references salons(id) on delete cascade not null,
  agent_type text not null,
  title text not null,
  body text not null,
  financial_impact numeric(12,2) default 0,
  priority text check (priority in ('critical','warning','info')) default 'info',
  action_label text,
  is_read boolean default false,
  created_at timestamptz default now()
);

create index idx_insights_salon_unread on insights(salon_id, is_read, created_at desc);

-- RLS: каждый видит только свои данные
alter table salons enable row level security;
alter table clients enable row level security;
alter table visits enable row level security;
alter table masters enable row level security;
alter table insights enable row level security;

-- Отзывы клиентов (внутренние + факт публикации на площадках)
create table reviews (
  id uuid primary key default uuid_generate_v4(),
  salon_id uuid references salons(id) on delete cascade not null,
  client_name text,
  master_name text,
  rating integer not null check (rating between 1 and 5),
  text text,
  is_public boolean default false,   -- true = клиент перешёл публиковать на площадку
  platform text,                     -- 'yandex'|'google'|'2gis'|'vk'|'internal'
  created_at timestamptz default now()
);

create index idx_reviews_salon on reviews(salon_id, created_at desc);
alter table reviews enable row level security;

-- Для демо: политики разрешают всё (в продакшне — через auth.uid())
create policy "allow_all_salons" on salons for all using (true) with check (true);
create policy "allow_all_clients" on clients for all using (true) with check (true);
create policy "allow_all_visits" on visits for all using (true) with check (true);
create policy "allow_all_masters" on masters for all using (true) with check (true);
create policy "allow_all_insights" on insights for all using (true) with check (true);
create policy "allow_all_reviews" on reviews for all using (true) with check (true);

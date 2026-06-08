-- BeautyOS — Salon Memory Foundation
-- Добавляет сущности для накопления истории и анализа динамики

-- Журнал загрузок данных
create table data_uploads (
  id uuid primary key default uuid_generate_v4(),
  salon_id uuid references salons(id) on delete cascade not null,
  filename text,
  period_from date,          -- минимальная дата визита в файле
  period_to date,            -- максимальная дата визита в файле
  row_count integer default 0,
  created_at timestamptz default now()
);

create index idx_uploads_salon on data_uploads(salon_id, created_at desc);

-- Исторические снапшоты ключевых метрик (для анализа динамики)
-- Создаётся после каждой загрузки данных
create table analysis_snapshots (
  id uuid primary key default uuid_generate_v4(),
  salon_id uuid references salons(id) on delete cascade not null,
  upload_id uuid references data_uploads(id),
  snapshot_date date not null default current_date,
  total_clients integer default 0,
  active_clients integer default 0,
  at_risk_clients integer default 0,
  lost_clients integer default 0,
  total_revenue numeric(14,2) default 0,
  avg_check numeric(10,2) default 0,
  retention_rate numeric(5,4) default 0,
  total_financial_impact numeric(14,2) default 0,
  created_at timestamptz default now()
);

create index idx_snapshots_salon_date on analysis_snapshots(salon_id, snapshot_date desc);

-- Рекомендованные и выполненные AI-действия по удержанию
create table actions (
  id uuid primary key default uuid_generate_v4(),
  salon_id uuid references salons(id) on delete cascade not null,
  action_type text check (action_type in ('call','sms','offer','review_request')) not null,
  title text not null,
  description text,
  target_client_ids uuid[],
  financial_impact numeric(12,2) default 0,
  probability numeric(4,3) default 0,
  status text check (status in ('pending','done','skipped')) default 'pending',
  created_at timestamptz default now(),
  completed_at timestamptz
);

create index idx_actions_salon_status on actions(salon_id, status, created_at desc);

-- Результаты выполненных действий (измеряется через 30 дней)
create table action_results (
  id uuid primary key default uuid_generate_v4(),
  action_id uuid references actions(id) on delete cascade not null,
  salon_id uuid references salons(id) on delete cascade not null,
  clients_contacted integer default 0,
  clients_returned integer default 0,
  revenue_recovered numeric(12,2) default 0,
  measured_at timestamptz default now()
);

-- Привязка визита к конкретной загрузке данных
alter table visits add column if not exists upload_id uuid references data_uploads(id);

-- RLS
alter table data_uploads enable row level security;
alter table analysis_snapshots enable row level security;
alter table actions enable row level security;
alter table action_results enable row level security;

create policy "allow_all_data_uploads" on data_uploads for all using (true) with check (true);
create policy "allow_all_snapshots" on analysis_snapshots for all using (true) with check (true);
create policy "allow_all_actions" on actions for all using (true) with check (true);
create policy "allow_all_action_results" on action_results for all using (true) with check (true);

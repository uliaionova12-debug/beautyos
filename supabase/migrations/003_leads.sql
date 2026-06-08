-- BeautyOS — Early Access Leads

create table leads (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  phone text,
  telegram text,
  business_type text,
  plan text,
  created_at timestamptz default now()
);

create index idx_leads_created on leads(created_at desc);

alter table leads enable row level security;
create policy "allow_all_leads" on leads for all using (true) with check (true);

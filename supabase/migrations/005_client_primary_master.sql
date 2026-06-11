-- Добавляем поле primary_master_name в таблицу clients
-- Позволяет фильтровать клиентов по мастеру без JOIN через visits

alter table clients
  add column if not exists primary_master_name text;

create index if not exists idx_clients_salon_master
  on clients(salon_id, primary_master_name);

-- Allow visits without explicit client_id link
-- (client matching is done at the application layer via retention analysis)
alter table visits alter column client_id drop not null;

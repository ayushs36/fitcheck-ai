-- Deploy only to the separate FitCheck Coach Supabase project.
begin;

create table public.mobile_records (
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('daily_log', 'workout', 'settings')),
  record_id text not null check (length(record_id) between 1 and 200),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  revision bigint not null default 1 check (revision > 0),
  deleted boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, kind, record_id),
  check (kind <> 'settings' or record_id = 'singleton')
);

alter table public.mobile_records enable row level security;
revoke all on public.mobile_records from public, anon, authenticated;
grant select, insert, update on public.mobile_records to authenticated;

create policy own_records_read on public.mobile_records
  for select to authenticated using ((select auth.uid()) = user_id);
create policy own_records_insert on public.mobile_records
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy own_records_update on public.mobile_records
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Clients supply the revision they read. A stale edit must be resolved explicitly.
-- Deletions are tombstones so an offline device cannot silently resurrect a log.
create function public.mobile_record_revision_guard()
returns trigger language plpgsql set search_path = '' as $$
begin
  if TG_OP = 'INSERT' then
    NEW.revision := 1;
  else
    if NEW.user_id <> OLD.user_id or NEW.kind <> OLD.kind
       or NEW.record_id <> OLD.record_id then
      raise exception 'Record identity cannot change' using errcode = '22023';
    end if;
    if NEW.revision <> OLD.revision then
      raise exception 'Sync conflict: fetch current record before retrying'
        using errcode = '40001';
    end if;
    NEW.revision := OLD.revision + 1;
  end if;
  NEW.updated_at := clock_timestamp();
  return NEW;
end;
$$;

revoke all on function public.mobile_record_revision_guard() from public, anon, authenticated;
create trigger mobile_record_revision_guard
before insert or update on public.mobile_records
for each row execute function public.mobile_record_revision_guard();

commit;

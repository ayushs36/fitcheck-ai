begin;
create table public.mobile_deletion_attempts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  window_started_at timestamptz not null,
  attempts integer not null check (attempts between 1 and 5)
);
alter table public.mobile_deletion_attempts enable row level security;
revoke all on public.mobile_deletion_attempts from public, anon, authenticated;

create function public.mobile_claim_deletion_attempt(account_id uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  current_time_value timestamptz := clock_timestamp();
  claimed integer;
begin
  insert into public.mobile_deletion_attempts as existing(user_id, window_started_at, attempts)
  values (account_id, current_time_value, 1)
  on conflict (user_id) do update set
    window_started_at = case when existing.window_started_at <= current_time_value - interval '15 minutes'
      then current_time_value else existing.window_started_at end,
    attempts = case when existing.window_started_at <= current_time_value - interval '15 minutes'
      then 1 else existing.attempts + 1 end
  where existing.attempts < 5 or existing.window_started_at <= current_time_value - interval '15 minutes'
  returning attempts into claimed;
  return claimed is not null;
end;
$$;
revoke all on function public.mobile_claim_deletion_attempt(uuid) from public, anon, authenticated;
grant execute on function public.mobile_claim_deletion_attempt(uuid) to service_role;
commit;

-- Run on a disposable Supabase test database, never against personal data.
begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

insert into auth.users (id) values
  ('00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000002');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
select lives_ok($$insert into public.mobile_records(user_id,kind,record_id,payload)
values(auth.uid(),'daily_log','2026-09-10','{"weightLbs":135}')$$,
'Owner can insert a record');
select is((select count(*) from public.mobile_records), 1::bigint, 'Owner can read record');
select throws_ok($$insert into public.mobile_records(user_id,kind,record_id,payload)
values('00000000-0000-0000-0000-000000000002','daily_log','2026-09-10','{}')$$,
'42501', null, 'Cannot insert for another user');
select lives_ok($$update public.mobile_records set payload='{"weightLbs":136}', revision=1$$,
'Current revision can update');
select is((select revision from public.mobile_records), 2::bigint, 'Server increments revision');
select throws_ok($$update public.mobile_records set payload='{}', revision=1$$,
'40001', null, 'Stale write rejected');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000002', true);
select is((select count(*) from public.mobile_records), 0::bigint, 'Other user cannot read');
with changed as (update public.mobile_records set payload='{}' returning *)
select is((select count(*) from changed), 0::bigint, 'Other user cannot update');

set local role anon;
select throws_ok($$select * from public.mobile_records$$, '42501', null, 'Signed-out access denied');
reset role;
select * from finish();
rollback;

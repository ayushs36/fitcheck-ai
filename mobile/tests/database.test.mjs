import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

test('mobile migration enforces ownership, revisions, and deletion rules in Postgres', async () => {
  const db = new PGlite();
  const a = '00000000-0000-0000-0000-000000000001';
  const b = '00000000-0000-0000-0000-000000000002';
  try {
    // Minimal Supabase auth contract; this test does not test hosted JWT validation.
    await db.exec(`create role anon; create role authenticated;
      create schema auth;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as
      $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      grant usage on schema auth to authenticated;
      insert into auth.users values ('${a}'),('${b}');`);
    await db.exec(await readFile(new URL('../supabase/migrations/202609100001_mobile_records.sql',import.meta.url),'utf8'));
    await db.exec(`set role authenticated; set request.jwt.claim.sub = '${a}';`);
    await db.query(`insert into public.mobile_records(user_id,kind,record_id,payload)
      values($1,'daily_log','2026-09-10',$2)`,[a,{weightLbs:135}]);
    assert.equal((await db.query('select * from public.mobile_records')).rows.length,1);
    await assert.rejects(db.query(`insert into public.mobile_records(user_id,kind,record_id,payload)
      values($1,'daily_log','2026-09-11','{}')`,[b]),{code:'42501'});
    await db.query(`update public.mobile_records set payload='{"weightLbs":136}',revision=1`);
    assert.equal(Number((await db.query('select revision from public.mobile_records')).rows[0].revision),2);
    await assert.rejects(db.query(`update public.mobile_records set payload='{}',revision=1`),{code:'40001'});
    await assert.rejects(db.query(`update public.mobile_records set record_id='new'`),{code:'22023'});
    await assert.rejects(db.query(`delete from public.mobile_records`),{code:'42501'});
    await db.query(`update public.mobile_records set deleted=true,revision=2`);
    const tombstone = (await db.query('select * from public.mobile_records')).rows[0];
    assert.equal(tombstone.deleted,true);
    assert.equal(Number(tombstone.revision),3);
    await assert.rejects(db.query(`update public.mobile_records set deleted=false,revision=2`),{code:'40001'});
    await db.exec(`set request.jwt.claim.sub = '${b}';`);
    assert.equal((await db.query('select * from public.mobile_records')).rows.length,0);
    assert.equal((await db.query(`update public.mobile_records set payload='{}' returning *`)).rows.length,0);
    await db.exec('reset role; set role anon;');
    for (const sql of ['select * from public.mobile_records', 'delete from public.mobile_records',
      `insert into public.mobile_records(user_id,kind,record_id,payload) values('${a}','settings','singleton','{}')`,
      `update public.mobile_records set deleted=true`]) {
      await assert.rejects(db.query(sql),{code:'42501'});
    }
    await db.exec(`reset role; delete from auth.users where id='${a}';`);
    assert.equal((await db.query('select * from public.mobile_records')).rows.length,0);
  } finally { await db.close(); }
});

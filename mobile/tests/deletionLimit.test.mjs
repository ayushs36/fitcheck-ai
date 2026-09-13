import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
test('database deletion limiter enforces budget, isolation, expiry, and private access',async()=>{
  const db=new PGlite();
  const owner='00000000-0000-0000-0000-000000000001';
  const other='00000000-0000-0000-0000-000000000002';
  try {
    await db.exec(`create role anon; create role authenticated; create role service_role;
      create schema auth; create table auth.users(id uuid primary key);
      insert into auth.users values('${owner}'),('${other}');`);
    await db.exec(await readFile(new URL('../supabase/migrations/202609120002_deletion_attempt_limit.sql',import.meta.url),'utf8'));
    const claim=async id=>(await db.query('select public.mobile_claim_deletion_attempt($1) as allowed',[id])).rows[0].allowed;
    for (const role of ['anon','authenticated']) {
      await db.exec(`set role ${role}`);
      await assert.rejects(claim(owner),{code:'42501'});
      await assert.rejects(db.query('select * from public.mobile_deletion_attempts'),{code:'42501'});
      await db.exec('reset role');
    }
    await db.exec('set role service_role');
    for(let i=0;i<5;i++) assert.equal(await claim(owner),true);
    assert.equal(await claim(owner),false);
    assert.equal(await claim(other),true);
    await db.exec(`reset role; update public.mobile_deletion_attempts set window_started_at=now()-interval '16 minutes' where user_id='${owner}'; set role service_role;`);
    assert.equal(await claim(owner),true);
    await db.exec(`reset role; delete from auth.users where id='${owner}'`);
    assert.equal((await db.query('select * from public.mobile_deletion_attempts')).rows.length,1);
  } finally {await db.close();}
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createOutbox } from '../src/cloud/outbox.ts';
const a='00000000-0000-0000-0000-000000000001';
const b='00000000-0000-0000-0000-000000000002';
const edit={kind:'daily_log',recordId:'2026-09-10',payload:{weightLbs:135},deleted:false,expectedRevision:null};
function memory(){const values=new Map();return {values,getItem:async k=>values.get(k)??null,setItem:async(k,v)=>{values.set(k,v);}};}
test('offline edits survive queue recreation and stay account-scoped',async()=>{
  const store=memory();await createOutbox(store,a).enqueue(edit);
  assert.equal((await createOutbox(store,a).list()).length,1);
  assert.equal((await createOutbox(store,b).list()).length,0);
});
test('acknowledgement removes only the uploaded version',async()=>{
  const queue=createOutbox(memory(),a);
  const sent=await queue.enqueue(edit);
  await queue.enqueue({...edit,payload:{weightLbs:136}});
  await queue.acknowledge(sent,1);
  const pending=await queue.list();
  assert.equal(pending.length,1);assert.equal(pending[0].payload.weightLbs,136);
  assert.equal(pending[0].expectedRevision,1);
  await queue.acknowledge(sent,1);
  assert.equal((await queue.list()).length,1);
  await queue.acknowledge(pending[0],2);
  assert.equal((await queue.list()).length,0);
});
test('deletions remain queued until successful upload',async()=>{
  const queue=createOutbox(memory(),a);
  await queue.enqueue({...edit,deleted:true,expectedRevision:4});
  assert.equal((await queue.list())[0].deleted,true);
});
test('corrupt queue is not treated as empty',async()=>{
  const store=memory();const queue=createOutbox(store,a);await queue.enqueue(edit);
  for(const key of store.values.keys())store.values.set(key,'broken');
  await assert.rejects(queue.list());await assert.rejects(queue.enqueue(edit));
  assert.equal([...store.values.values()][0],'broken');
});
test('concurrent edits coalesce without losing the latest payload',async()=>{
  const queue=createOutbox(memory(),a);
  await Promise.all([queue.enqueue(edit),queue.enqueue({...edit,payload:{steps:5000}})]);
  assert.deepEqual((await queue.list())[0].payload,{steps:5000});
});
test('changing the base revision requires explicit conflict resolution',async()=>{
  const queue=createOutbox(memory(),a);await queue.enqueue(edit);
  await assert.rejects(queue.enqueue({...edit,expectedRevision:2}));
  assert.equal((await queue.list())[0].expectedRevision,null);
});

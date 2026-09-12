import {test} from 'node:test';
import assert from 'node:assert/strict';
import {needsWorkspaceSetup,prepareAccountWorkspace} from '../src/cloud/prepareWorkspace.ts';
import {createAccountWorkspace} from '../src/cloud/workspace.ts';
const owner='00000000-0000-0000-0000-000000000001';
const log={id:'log',date:'2026-09-11',goal:'cut',weightLbs:135,createdAt:'2026-09-11T12:00:00Z',updatedAt:'2026-09-11T12:00:00Z'};
const snapshot={logs:JSON.stringify([log]),workouts:'[]',settings:null};
function memory(){const values=new Map();return {values,getItem:async key=>values.get(key)??null,setItem:async(key,value)=>{values.set(key,value);}};}
test('keeping records separate never imports legacy values',async()=>{
  const storage=memory();
  storage.values.set('fitcheck-mobile:daily-logs:v1',snapshot.logs);
  assert.equal(await needsWorkspaceSetup(storage,owner),true);
  await prepareAccountWorkspace(storage,owner,'separate',snapshot);
  assert.equal(await needsWorkspaceSetup(storage,owner),false);
  assert.equal((await createAccountWorkspace(storage,owner).snapshot()).pending.length,0);
  assert.equal(storage.values.get('fitcheck-mobile:daily-logs:v1'),snapshot.logs);
});
test('explicit import creates backed-up pending records and refuses replacement',async()=>{
  const storage=memory();
  await prepareAccountWorkspace(storage,owner,'import',snapshot);
  assert.deepEqual((await createAccountWorkspace(storage,owner).snapshot()).pending[0].payload,log);
  await assert.rejects(prepareAccountWorkspace(storage,owner,'separate'),/already exists/);
});
test('invalid import choice does not initialize an empty workspace',async()=>{
  const storage=memory();
  await assert.rejects(prepareAccountWorkspace(storage,owner,'import'));
  assert.equal(storage.values.size,0);
});

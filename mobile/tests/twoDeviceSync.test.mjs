import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createAccountWorkspace,visibleWorkspaceRecords} from '../src/cloud/workspace.ts';
import {createAccountSync} from '../src/cloud/sync.ts';
import {SyncConflictError} from '../src/cloud/recordStore.ts';
const owner='00000000-0000-0000-0000-000000000001';
const log={id:'log',date:'2026-09-11',goal:'maintain',weightLbs:135,
  createdAt:'2026-09-11T12:00:00Z',updatedAt:'2026-09-11T12:00:00Z'};
const initial={kind:'daily_log',recordId:log.date,payload:log,deleted:false,expectedRevision:null};
const clone=value=>JSON.parse(JSON.stringify(value));
function server() {
  const rows=new Map();
  return {
    downloadPage:async kind=>({records:clone([...rows.values()].filter(row=>row.kind===kind)),nextCursor:null}),
    push:async edit=>{
      const key=`${edit.kind}:${edit.recordId}`;
      const old=rows.get(key);
      if ((old?.revision??null)!==edit.expectedRevision) throw new SyncConflictError();
      const revision=(old?.revision??0)+1;
      rows.set(key,clone({user_id:owner,kind:edit.kind,record_id:edit.recordId,payload:edit.payload,deleted:edit.deleted,revision}));
      return revision;
    },
  };
}
function device(transport) {
  const values=new Map();
  const storage={getItem:async key=>values.get(key)??null,setItem:async(key,value)=>{values.set(key,value);}};
  const workspace=createAccountWorkspace(storage,owner);
  return {workspace,sync:createAccountSync(workspace,transport),storage};
}
test('a new device restores a partial log without inventing missing nutrition',async()=>{
  const transport=server();
  const a=device(transport),b=device(transport);
  await a.workspace.edit(initial);
  await a.sync.run();
  await b.sync.run();
  const restored=visibleWorkspaceRecords(await b.workspace.snapshot());
  assert.deepEqual(restored[0].payload,log);
  assert.equal('calories' in restored[0].payload,false);
});
test('two-device offline conflict preserves both edits and explicit resolution syncs back',async()=>{
  const transport=server();
  const a=device(transport),b=device(transport);
  await a.workspace.edit(initial);
  await a.sync.run();
  await b.sync.run();
  await a.workspace.edit({...initial,expectedRevision:1,payload:{...log,calories:2200}});
  await b.workspace.edit({...initial,expectedRevision:1,payload:{...log,calories:2300}});
  await a.sync.run();
  assert.deepEqual(await b.sync.run(),{pending:1,conflicts:1});
  const conflict=(await b.workspace.snapshot()).conflicts[0];
  assert.equal(conflict.local.payload.calories,2300);
  assert.equal(conflict.remote.payload.calories,2200);
  await b.workspace.resolve(initial.kind,initial.recordId,2,'local');
  await b.sync.run();
  await a.sync.run();
  assert.equal(visibleWorkspaceRecords(await a.workspace.snapshot())[0].payload.calories,2300);
});
test('server success followed by lost response keeps pending edit and recovers without overwrite',async()=>{
  const transport=server();
  const a=device(transport);
  await a.workspace.edit(initial);
  const push=transport.push;
  transport.push=async edit=>{await push(edit);throw new Error('response lost');};
  await assert.rejects(a.sync.run(),/response lost/);
  assert.equal((await a.workspace.snapshot()).pending.length,1);
  transport.push=push;
  assert.equal((await a.sync.run()).conflicts,1);
  await a.workspace.resolve(initial.kind,initial.recordId,1,'remote');
  assert.equal((await a.sync.run()).pending,0);
  assert.deepEqual(visibleWorkspaceRecords(await a.workspace.snapshot())[0].payload,log);
});
test('remote deletion cannot silently erase a second device offline edit',async()=>{
  const transport=server();
  const a=device(transport),b=device(transport);
  await a.workspace.edit(initial);
  await a.sync.run();
  await b.sync.run();
  await a.workspace.edit({...initial,expectedRevision:1,deleted:true});
  await b.workspace.edit({...initial,expectedRevision:1,payload:{...log,steps:8000}});
  await a.sync.run();
  await b.sync.run();
  assert.equal(visibleWorkspaceRecords(await b.workspace.snapshot())[0].payload.steps,8000);
  assert.equal((await b.workspace.snapshot()).conflicts[0].remote.deleted,true);
});

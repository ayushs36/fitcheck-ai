import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createAccountWorkspace, visibleWorkspaceRecords} from '../src/cloud/workspace.ts';
import {createAccountMigration} from '../src/storage/accountStorage.ts';
const owner = '00000000-0000-0000-0000-000000000001';
const other = '00000000-0000-0000-0000-000000000002';
const payload = {id:'log',date:'2026-09-11',goal:'cut',weightLbs:135,
  createdAt:'2026-09-11T12:00:00Z',updatedAt:'2026-09-11T12:00:00Z'};
const edit = {kind:'daily_log',recordId:payload.date,payload,deleted:false,expectedRevision:null};
const remote = {user_id:owner,kind:edit.kind,record_id:edit.recordId,payload,deleted:false,revision:1};
function memory() {
  const values = new Map();
  return {values,getItem:async key=>values.get(key)??null,setItem:async(key,value)=>{values.set(key,value);}};
}
test('one persisted document preserves local edits and pending upload across restart',async()=>{
  const storage=memory();
  await createAccountWorkspace(storage,owner).edit(edit);
  assert.equal(storage.values.size,1);
  const state=await createAccountWorkspace(storage,owner).snapshot();
  assert.equal(state.pending.length,1);
  assert.deepEqual(visibleWorkspaceRecords(state)[0].payload,payload);
  assert.equal('calories' in visibleWorkspaceRecords(state)[0].payload,false);
  assert.equal((await createAccountWorkspace(storage,other).snapshot()).pending.length,0);
});
test('failed save leaves prior document and pending edits intact',async()=>{
  const storage=memory();
  const workspace=createAccountWorkspace(storage,owner);
  await workspace.edit(edit);
  const before=await workspace.snapshot();
  storage.setItem=async()=>{throw new Error('disk full');};
  await assert.rejects(workspace.edit({...edit,payload:{...payload,calories:2200}}),/disk full/);
  assert.deepEqual(await workspace.snapshot(),before);
});
test('corrupt storage fails closed without writing an empty replacement',async()=>{
  const storage=memory();
  const workspace=createAccountWorkspace(storage,owner);
  await workspace.edit(edit);
  const key=[...storage.values.keys()][0];
  storage.values.set(key,'broken');
  await assert.rejects(workspace.edit(edit));
  assert.equal(storage.values.get(key),'broken');
});
test('upload acknowledgement keeps an edit made while upload was in flight',async()=>{
  const workspace=createAccountWorkspace(memory(),owner);
  const sent=await workspace.edit(edit);
  await workspace.edit({...edit,payload:{...payload,calories:2200}});
  await workspace.acknowledge(sent,1);
  const state=await workspace.snapshot();
  assert.equal(state.records[0].payload.calories,undefined);
  assert.equal(state.pending[0].expectedRevision,1);
  assert.equal(visibleWorkspaceRecords(state)[0].payload.calories,2200);
  await workspace.acknowledge(state.pending[0],2);
  assert.equal((await workspace.snapshot()).pending.length,0);
});
test('conflicts persist across pages and require explicit version choice',async()=>{
  const workspace=createAccountWorkspace(memory(),owner);
  await workspace.receive([remote]);
  await workspace.edit({...edit,expectedRevision:1,payload:{...payload,calories:2200}});
  await workspace.receive([{...remote,revision:2,payload:{...payload,calories:2300}}]);
  await workspace.receive([]);
  assert.equal((await workspace.snapshot()).conflicts.length,1);
  await assert.rejects(workspace.edit({...edit,expectedRevision:1}));
  await assert.rejects(workspace.resolve(edit.kind,edit.recordId,1,'remote'));
  await workspace.resolve(edit.kind,edit.recordId,2,'local');
  const state=await workspace.snapshot();
  assert.equal(state.conflicts.length,0);
  assert.equal(state.pending[0].expectedRevision,2);
  assert.equal(state.pending[0].payload.calories,2200);
});
test('choosing remote deletion removes visible data only after explicit resolution',async()=>{
  const workspace=createAccountWorkspace(memory(),owner);
  await workspace.receive([remote]);
  await workspace.edit({...edit,expectedRevision:1});
  await workspace.receive([{...remote,revision:2,deleted:true}]);
  assert.equal(visibleWorkspaceRecords(await workspace.snapshot()).length,1);
  await workspace.resolve(edit.kind,edit.recordId,2,'remote');
  assert.equal(visibleWorkspaceRecords(await workspace.snapshot()).length,0);
});
test('separate instances serialize edits to different records',async()=>{
  const storage=memory();
  const first=createAccountWorkspace(storage,owner),second=createAccountWorkspace(storage,owner);
  await Promise.all([first.edit(edit),second.edit({...edit,recordId:'2026-09-12',payload:{...payload,date:'2026-09-12'}})]);
  assert.equal((await first.snapshot()).pending.length,2);
});
test('foreign-account downloads never alter saved data',async()=>{
  const workspace=createAccountWorkspace(memory(),owner);
  await workspace.edit(edit);
  const before=await workspace.snapshot();
  await assert.rejects(workspace.receive([{...remote,user_id:other}]));
  assert.deepEqual(await workspace.snapshot(),before);
});

test('verified import transfers all available fields atomically and retains backups',async()=>{
  const storage=memory();
  const snapshot={logs:JSON.stringify([{...payload,steps:8000,notes:'original'}]),workouts:'[]',settings:null};
  const imported=await createAccountMigration(storage)(owner,snapshot,true);
  const workspace=createAccountWorkspace(storage,owner);
  await workspace.importVerifiedBackup();
  const state=await workspace.snapshot();
  assert.equal(state.pending.length,1);
  assert.equal(state.pending[0].payload.notes,'original');
  assert.equal(await storage.getItem(imported.backupKey),JSON.stringify(snapshot));
  await assert.rejects(workspace.importVerifiedBackup(),/already exists/);
  assert.deepEqual(await workspace.snapshot(),state);
});
test('import refuses missing or changed backups',async()=>{
  const storage=memory();
  const workspace=createAccountWorkspace(storage,owner);
  await assert.rejects(workspace.importVerifiedBackup(),/verified account import backup/);
  const result=await createAccountMigration(storage)(owner,{logs:JSON.stringify([payload]),workouts:'[]',settings:null},true);
  storage.values.set(result.key,'{}');
  await assert.rejects(workspace.importVerifiedBackup(),/verified account import backup/);
  assert.equal((await workspace.snapshot()).pending.length,0);
});

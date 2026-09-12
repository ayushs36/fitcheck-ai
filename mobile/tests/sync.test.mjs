import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createAccountWorkspace} from '../src/cloud/workspace.ts';
import {createAccountSync} from '../src/cloud/sync.ts';
import {SyncConflictError} from '../src/cloud/recordStore.ts';
const owner='00000000-0000-0000-0000-000000000001';
const edit={kind:'workout',recordId:'session-1',payload:{},deleted:true,expectedRevision:null};
function setup() {
  const values=new Map();
  const workspace=createAccountWorkspace({getItem:async key=>values.get(key)??null,setItem:async(key,value)=>{values.set(key,value);}},owner);
  const calls=[];
  const transport={downloadPage:async(kind,cursor)=>{calls.push(['download',kind,cursor]);return {records:[],nextCursor:null};},
    push:async write=>{calls.push(['push',write]);return (write.expectedRevision??0)+1;}};
  return {workspace,transport,calls};
}
test('one sync pass downloads each kind and atomically acknowledges uploads',async()=>{
  const {workspace,transport,calls}=setup();
  await workspace.edit(edit);
  assert.deepEqual(await createAccountSync(workspace,transport).run(),{pending:0,conflicts:0});
  assert.equal(calls.filter(call=>call[0]==='download').length,3);
  assert.equal((await workspace.snapshot()).records[0].deleted,true);
});
test('offline failures retain pending data for a later explicit retry',async()=>{
  const {workspace,transport}=setup();
  await workspace.edit(edit);
  transport.push=async()=>{throw new Error('offline');};
  const sync=createAccountSync(workspace,transport);
  await assert.rejects(sync.run(),/offline/);
  assert.equal((await workspace.snapshot()).pending.length,1);
  transport.push=async()=>1;
  assert.equal((await sync.run()).pending,0);
});
test('concurrent requests share one in-flight sync',async()=>{
  const {workspace,transport,calls}=setup();
  await workspace.edit(edit);
  const sync=createAccountSync(workspace,transport);
  const first=sync.run(),second=sync.run();
  assert.equal(first,second);
  await first;
  assert.equal(calls.filter(call=>call[0]==='push').length,1);
});
test('closing session during a download prevents any local receipt',async()=>{
  const {workspace,transport}=setup();
  let finish;
  transport.downloadPage=()=>new Promise(resolve=>{finish=resolve;});
  const sync=createAccountSync(workspace,transport);
  const task=sync.run();
  sync.dispose();
  finish({records:[{user_id:owner,kind:'workout',record_id:'remote',payload:{},deleted:true,revision:1}],nextCursor:null});
  await assert.rejects(task,/session closed/);
  assert.equal((await workspace.snapshot()).records.length,0);
});
test('revision conflicts fetch both versions without forced overwrite',async()=>{
  const {workspace,transport}=setup();
  await workspace.edit(edit);
  let serverChanged=false,pushes=0;
  transport.push=async()=>{pushes++;serverChanged=true;throw new SyncConflictError();};
  transport.downloadPage=async kind=>({records:serverChanged&&kind==='workout'
    ?[{user_id:owner,kind:'workout',record_id:edit.recordId,payload:{},deleted:true,revision:1}]:[],nextCursor:null});
  const result=await createAccountSync(workspace,transport).run();
  assert.deepEqual(result,{pending:1,conflicts:1});
  assert.equal(pushes,1);
});
test('nonadvancing pagination fails instead of looping forever',async()=>{
  const {workspace,transport}=setup();
  transport.downloadPage=async()=>({records:[],nextCursor:'same'});
  await assert.rejects(createAccountSync(workspace,transport).run(),/cursor did not advance/);
});

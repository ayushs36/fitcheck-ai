import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createCloudRecordStore,SyncConflictError} from '../src/cloud/recordStore.ts';
const id='00000000-0000-0000-0000-000000000001';
const write={kind:'daily_log',recordId:'2026-09-10',deleted:false,expectedRevision:2,
  payload:{id:'l',date:'2026-09-10',goal:'cut',weightLbs:135,createdAt:'2026-09-10T12:00:00Z',updatedAt:'2026-09-10T12:00:00Z'}};
function mock(result,userId=id){
  const calls=[];
  const query={update:value=>{calls.push(['update',value]);return query;},insert:value=>{calls.push(['insert',value]);return query;},
    eq:(key,value)=>{calls.push(['eq',key,value]);return query;},select:()=>query,maybeSingle:async()=>result};
  return {calls,client:{auth:{getUser:async()=>({data:{user:{id:userId}},error:null})},from:()=>{calls.push(['from']);return query;}}};
}
test('uploads explicitly filter by owner, record and expected revision',async()=>{
  const {client,calls}=mock({data:{revision:3},error:null});
  assert.equal(await createCloudRecordStore(client,id).push(write),3);
  assert.ok(calls.some(x=>x[0]==='eq'&&x[1]==='user_id'&&x[2]===id));
  assert.ok(calls.some(x=>x[0]==='eq'&&x[1]==='revision'&&x[2]===2));
});
test('account switching stops upload before database access',async()=>{
  const {client,calls}=mock({},'00000000-0000-0000-0000-000000000002');
  await assert.rejects(createCloudRecordStore(client,id).push(write),/Account changed/);
  assert.equal(calls.length,0);
});
test('stale updates and duplicate inserts require conflict resolution',async()=>{
  for(const result of [{data:null,error:null},{data:null,error:{code:'23505'}},{data:null,error:{code:'40001'}}]){
    await assert.rejects(createCloudRecordStore(mock(result).client,id).push(write),SyncConflictError);
  }
});
test('invalid payload cannot be uploaded',async()=>{
  const {client,calls}=mock({});
  await assert.rejects(createCloudRecordStore(client,id).push({...write,payload:{}}));
  assert.equal(calls.length,0);
});
test('network errors propagate without acknowledging pending data',async()=>{
  await assert.rejects(createCloudRecordStore(mock({data:null,error:new Error('network')}).client,id).push(write),/network/);
});

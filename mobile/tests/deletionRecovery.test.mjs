import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createDeletionRecovery} from '../src/cloud/deletionRecovery.ts';
import {accountStorageKey} from '../src/storage/accountStorage.ts';
const owner='00000000-0000-0000-0000-000000000001';
const other='00000000-0000-0000-0000-000000000002';
const journal='fitcheck-coach:pending-deletion-cleanup:v1';
function memory() {
  const values=new Map();
  return {values,getItem:async key=>values.get(key)??null,setItem:async(key,value)=>{values.set(key,value);}};
}
test('interrupted cleanup resumes from durable receipt without another cloud deletion',async()=>{
  const storage=memory();
  const set=storage.setItem;
  storage.setItem=async(key,value)=>{if(key.endsWith(':workspace:v1'))throw Error('disk failed');return set(key,value);};
  await assert.rejects(createDeletionRecovery(storage,async()=>{}).recordAndFinish(owner));
  assert.deepEqual(JSON.parse(storage.values.get(journal)),[owner]);
  storage.setItem=set;
  const signedOut=[];
  await createDeletionRecovery(storage,async id=>{signedOut.push(id);}).resume();
  assert.deepEqual(signedOut,[owner]);
  assert.equal(JSON.parse(storage.values.get(`${accountStorageKey(owner)}:workspace:v1`)).accountDeleted,true);
  assert.deepEqual(JSON.parse(storage.values.get(journal)),[]);
});
test('failed sign-out retains receipt and retries without touching original logs',async()=>{
  const storage=memory();
  storage.values.set('fitcheck-mobile:logs:v1','original');
  storage.values.set(`${accountStorageKey(other)}:workspace:v1`,'other account');
  await assert.rejects(createDeletionRecovery(storage,async()=>{throw Error('keychain unavailable');}).recordAndFinish(owner));
  assert.deepEqual(JSON.parse(storage.values.get(journal)),[owner]);
  await createDeletionRecovery(storage,async()=>{}).resume();
  assert.equal(storage.values.get('fitcheck-mobile:logs:v1'),'original');
  assert.equal(storage.values.get(`${accountStorageKey(other)}:workspace:v1`),'other account');
});
test('failed journal write does not start cache cleanup',async()=>{
  const storage=memory();
  storage.setItem=async()=>{throw Error('disk full');};
  await assert.rejects(createDeletionRecovery(storage,async()=>assert.fail('must not sign out')).recordAndFinish(owner));
  assert.equal(storage.values.size,0);
});
test('corrupt journal fails closed instead of clearing unrelated storage',async()=>{
  const storage=memory();
  storage.values.set(journal,JSON.stringify(['not-an-account-id']));
  await assert.rejects(createDeletionRecovery(storage,async()=>assert.fail('must not sign out')).resume());
  assert.equal(storage.values.size,1);
});
test('concurrent recovery instances serialize account cleanup receipts',async()=>{
  const storage=memory();
  const signedOut=[];
  const a=createDeletionRecovery(storage,async id=>signedOut.push(id));
  const b=createDeletionRecovery(storage,async id=>signedOut.push(id));
  const first=a.recordAndFinish(owner);
  const second=b.recordAndFinish(other);
  await first;
  await second;
  assert.deepEqual(signedOut,[owner,other]);
  assert.deepEqual(JSON.parse(storage.values.get(journal)),[]);
});
test('deletion preflight verifies storage without clearing records or claiming success',async()=>{
  const storage=memory();
  storage.values.set('fitcheck-mobile:logs:v1','original');
  const recovery=createDeletionRecovery(storage,async()=>assert.fail('must not sign out'));
  await recovery.verifyWritable();
  assert.equal(storage.values.get('fitcheck-mobile:logs:v1'),'original');
  assert.deepEqual(JSON.parse(storage.values.get(journal)),[]);
  storage.setItem=async()=>{throw Error('disk full');};
  await assert.rejects(recovery.verifyWritable());
});
test('pending recovery blocks a new deletion preflight',async()=>{
  const storage=memory();
  storage.values.set(journal,JSON.stringify([owner]));
  await assert.rejects(createDeletionRecovery(storage,async()=>{}).verifyWritable(),/Finish pending/);
  assert.deepEqual(JSON.parse(storage.values.get(journal)),[owner]);
});

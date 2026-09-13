import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createOfflineAccess} from '../src/cloud/offlineAccess.ts';
const owner='00000000-0000-0000-0000-000000000001';
const other='00000000-0000-0000-0000-000000000002';
const disconnected={name:'AuthRetryableFetchError',status:0};
function setup() {
  const values=new Map();
  const secure={getItem:async key=>values.get(key)??null,setItem:async(key,value)=>{values.set(key,value);}};
  let time=1_800_000_000_000;
  return {values,secure,access:createOfflineAccess(secure,()=>time),advance:ms=>{time+=ms;}};
}
test('only a matching previously verified account receives offline permission',async()=>{
  const {access}=setup();
  assert.equal(await access.allowedAccount(disconnected,owner),null);
  await access.rememberVerifiedAccount(owner);
  assert.equal(await access.allowedAccount(disconnected,owner),owner);
  assert.equal(await access.allowedAccount(disconnected,other),null);
  assert.equal(await access.allowedAccount(disconnected,null),null);
});
test('rejected credentials and service errors never unlock offline access',async()=>{
  const {access}=setup();
  await access.rememberVerifiedAccount(owner);
  for(const error of [{name:'AuthApiError',status:401},{name:'AuthApiError',status:403},
    {name:'AuthRetryableFetchError',status:503},new Error('network'),null]) {
    assert.equal(await access.allowedAccount(error,owner),null);
  }
});
test('offline permission expires and does not survive clock rollback',async()=>{
  const {access,advance}=setup();
  await access.rememberVerifiedAccount(owner);
  advance(7*24*60*60*1000);
  assert.equal(await access.allowedAccount(disconnected,owner),null);
  await access.rememberVerifiedAccount(owner);
  advance(-1);
  assert.equal(await access.allowedAccount(disconnected,owner),null);
});
test('revocation prevents reopening and corrupt grants fail closed',async()=>{
  const {access,values}=setup();
  await access.rememberVerifiedAccount(owner);
  await access.revoke();
  assert.equal(await access.allowedAccount(disconnected,owner),null);
  for(const key of values.keys()) values.set(key,'broken');
  assert.equal(await access.allowedAccount(disconnected,owner),null);
});

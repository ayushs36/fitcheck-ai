import {test} from 'node:test';
import assert from 'node:assert/strict';
import {openAccountSession} from '../src/cloud/session.ts';
const owner='00000000-0000-0000-0000-000000000001';
const other='00000000-0000-0000-0000-000000000002';
function setup(ids=[owner,owner]) {
  const values=new Map();
  let callback,reads=0,unsubscribed=0;
  const storage={getItem:async key=>values.get(key)??null,setItem:async(key,value)=>{values.set(key,value);}};
  const client={auth:{
    getUser:async()=>({data:{user:ids[reads] ? {id:ids[reads++],email:'fictional@example.com'} : null},error:null}),
    onAuthStateChange:cb=>{callback=cb;return {data:{subscription:{unsubscribe:()=>{unsubscribed++;}}}};},
    signOut:async()=>({error:null}),
  }};
  return {client,storage,values,emit:(event,id)=>callback(event,id?{user:{id}}:null),unsubscribed:()=>unsubscribed};
}
test('opening verifies identity without importing or uploading any data',async()=>{
  const state=setup();
  const session=await openAccountSession(state.client,state.storage);
  assert.equal(session.userId,owner);
  assert.equal(state.values.size,0);
  assert.deepEqual(await session.data.loadDailyLogs(),[]);
  session.close();
  assert.equal(state.unsubscribed(),1);
});
test('missing identity cannot open account storage',async()=>{
  const state=setup([]);
  await assert.rejects(openAccountSession(state.client,state.storage),/Sign in/);
  assert.equal(state.values.size,0);
});
test('account changing during startup closes the partially opened session',async()=>{
  const state=setup([owner,other]);
  await assert.rejects(openAccountSession(state.client,state.storage),/Account changed/);
  assert.equal(state.unsubscribed(),1);
});
test('sign-out event closes storage and notifies UI once',async()=>{
  const state=setup();
  const session=await openAccountSession(state.client,state.storage);
  let closed=0;
  session.onClosed(()=>{closed++;});
  state.emit('SIGNED_OUT');
  session.close();
  assert.equal(closed,1);
  await assert.rejects(session.data.loadDailyLogs(),/session closed/);
  await assert.rejects(session.synchronize(),/session closed/);
});
test('switching identities invalidates the old session',async()=>{
  const state=setup();
  const session=await openAccountSession(state.client,state.storage);
  state.emit('SIGNED_IN',other);
  await assert.rejects(session.conflicts(),/session closed/);
  let signOutCalled=false;
  state.client.auth.signOut=async()=>{signOutCalled=true;return {error:null};};
  await assert.rejects(session.signOut(),/session closed/);
  assert.equal(signOutCalled,false);
});
test('same-account token refresh does not close the workspace',async()=>{
  const state=setup();
  const session=await openAccountSession(state.client,state.storage);
  state.emit('TOKEN_REFRESHED',owner);
  assert.deepEqual(await session.data.loadDailyLogs(),[]);
  session.close();
});
test('failed sign-out still locks account data without deleting it',async()=>{
  const state=setup();
  const session=await openAccountSession(state.client,state.storage);
  await session.data.saveUserSettings({unitSystem:'imperial',defaultGoal:'cut'});
  const before=[...state.values.entries()];
  state.client.auth.signOut=async()=>({error:new Error('sign-out failed')});
  await assert.rejects(session.signOut(),/sign-out failed/);
  await assert.rejects(session.data.loadUserSettings(),/session closed/);
  assert.deepEqual([...state.values.entries()],before);
});

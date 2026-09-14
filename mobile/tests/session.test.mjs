import {test} from 'node:test';
import assert from 'node:assert/strict';
import {openAccountSession} from '../src/cloud/session.ts';
import {createOfflineAccess} from '../src/cloud/offlineAccess.ts';
const owner='00000000-0000-0000-0000-000000000001';
const other='00000000-0000-0000-0000-000000000002';
const webExport=JSON.stringify({format:'fitcheck-personal-logs',version:1,units:'lb',logs:[{
  date:'2026-09-01',goal:'Cutting',weight:135,calories:0,protein:0,steps:0,workout:'',exercises:[],
}]});
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
test('web import verifies the current account and refuses a foreign identity',async()=>{
  const state=setup([owner,owner,other]);
  const session=await openAccountSession(state.client,state.storage);
  const preview=await session.previewWebImport(webExport);
  await assert.rejects(session.importWebLogs(webExport,preview.dates),/sign in to this account/);
  assert.equal(state.values.size,0);
  session.close();
});
test('web import binds saved records to the verified session, not an export identifier',async()=>{
  const state=setup([owner,owner,owner]);
  const session=await openAccountSession(state.client,state.storage);
  const raw=JSON.stringify({...JSON.parse(webExport),ownerId:other,email:'other@example.com'});
  const preview=await session.previewWebImport(raw);
  await session.importWebLogs(raw,preview.dates);
  assert.equal((await session.data.loadDailyLogs()).length,1);
  assert.ok([...state.values.keys()].every(key=>key.includes(owner)));
  session.close();
});
test('a closed session cannot confirm a previously previewed web import',async()=>{
  const state=setup();
  const session=await openAccountSession(state.client,state.storage);
  const preview=await session.previewWebImport(webExport);
  state.emit('SIGNED_OUT');
  await assert.rejects(session.importWebLogs(webExport,preview.dates),/session closed/);
  assert.equal(state.values.size,0);
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

test('cancelled or failed deletion retains active records and session',async()=>{
  const state=setup();
  const session=await openAccountSession(state.client,state.storage);
  await session.data.saveUserSettings({unitSystem:'imperial',defaultGoal:'cut'});
  const before=[...state.values];
  assert.equal(await session.deleteAccount(async()=> 'cancelled'),'cancelled');
  await assert.rejects(session.deleteAccount(async()=>{throw new Error('connection lost');}),/connection lost/);
  assert.deepEqual([...state.values],before);
  assert.equal((await session.data.loadUserSettings()).defaultGoal,'cut');
  session.close();
});
test('confirmed deletion retires workspace and signs out only its owner',async()=>{
  const state=setup();
  state.client.auth.getSession=async()=>({data:{session:{user:{id:owner}}},error:null});
  let signedOut=0;
  state.client.auth.signOut=async()=>{signedOut++;return {error:null};};
  const session=await openAccountSession(state.client,state.storage);
  await session.data.saveUserSettings({unitSystem:'imperial',defaultGoal:'cut'});
  state.values.set('fitcheck-mobile:logs:v1','original logs');
  assert.equal(await session.deleteAccount(async id=>{assert.equal(id,owner);return 'deleted';}),'deleted');
  assert.equal(signedOut,1);
  assert.equal(state.values.get('fitcheck-mobile:logs:v1'),'original logs');
  const marker=[...state.values].find(([key])=>key.endsWith(':workspace:v1'))[1];
  assert.equal(JSON.parse(marker).accountDeleted,true);
  await assert.rejects(session.data.loadUserSettings(),/session closed/);
});
test('successful deletion does not sign out a newly active different account',async()=>{
  const state=setup();
  state.client.auth.getSession=async()=>({data:{session:{user:{id:other}}},error:null});
  let signedOut=false;
  state.client.auth.signOut=async()=>{signedOut=true;return {error:null};};
  const session=await openAccountSession(state.client,state.storage);
  await session.deleteAccount(async()=>{state.emit('SIGNED_IN',other);return 'deleted';});
  assert.equal(signedOut,false);
});
test('deletion cleanup failure reports cloud deletion truthfully and locks records',async()=>{
  const state=setup();
  state.client.auth.getSession=async()=>({data:{session:null},error:null});
  const session=await openAccountSession(state.client,state.storage);
  await session.data.saveUserSettings({unitSystem:'imperial',defaultGoal:'cut'});
  state.storage.setItem=async()=>{throw new Error('disk failure');};
  await assert.rejects(session.deleteAccount(async()=> 'deleted'),/cloud account was deleted.*cache cleanup needs attention/);
  await assert.rejects(session.data.loadUserSettings(),/session closed/);
});
test('duplicate deletion and manual sign-out are blocked during confirmation',async()=>{
  const state=setup();
  const session=await openAccountSession(state.client,state.storage);
  let release;
  const first=session.deleteAccount(()=>new Promise(resolve=>{release=resolve;}));
  await assert.rejects(session.deleteAccount(async()=> 'deleted'),/already in progress/);
  await assert.rejects(session.signOut(),/Wait for account deletion/);
  release('cancelled');
  await first;
  session.close();
});

test('offline reopening requires secure permission, matching cached session, and existing workspace',async()=>{
  const state=setup();
  const secure=setup().storage;
  const access=createOfflineAccess(secure);
  const initial=await openAccountSession(state.client,state.storage,access);
  await initial.data.saveUserSettings({unitSystem:'imperial',defaultGoal:'cut'});
  await access.rememberVerifiedAccount(owner);
  initial.close();
  state.client.auth.getUser=async()=>({data:{user:null},error:{name:'AuthRetryableFetchError',status:0}});
  state.client.auth.getSession=async()=>({data:{session:{user:{id:owner}}},error:null});
  const offline=await openAccountSession(state.client,state.storage,access);
  assert.equal(offline.isOffline,true);
  assert.equal((await offline.data.loadUserSettings()).defaultGoal,'cut');
  await offline.signOut();
  await assert.rejects(openAccountSession(state.client,state.storage,access));
});
test('offline permission never creates a new empty workspace',async()=>{
  const state=setup();
  const access=createOfflineAccess(setup().storage);
  await access.rememberVerifiedAccount(owner);
  state.client.auth.getUser=async()=>({data:{user:null},error:{name:'AuthRetryableFetchError',status:0}});
  state.client.auth.getSession=async()=>({data:{session:{user:{id:owner}}},error:null});
  await assert.rejects(openAccountSession(state.client,state.storage,access),/Connect to restore/);
  assert.equal(state.values.size,0);
});
test('failed offline permission cleanup still attempts Supabase sign-out',async()=>{
  const state=setup();
  const access=createOfflineAccess(setup().storage);
  access.revoke=async()=>{throw Error('keychain unavailable');};
  let signedOut=false;
  state.client.auth.signOut=async()=>{signedOut=true;return {error:null};};
  const session=await openAccountSession(state.client,state.storage,access);
  await session.data.saveUserSettings({unitSystem:'imperial',defaultGoal:'cut'});
  const before=[...state.values];
  await assert.rejects(session.signOut(),/Signed out, but offline permission cleanup/);
  assert.equal(signedOut,true);
  assert.deepEqual([...state.values],before);
  await assert.rejects(session.data.loadUserSettings(),/session closed/);
});

for (const scenario of [
  {name:'expired token cannot refresh offline',sessionError:{name:'AuthRetryableFetchError',status:0}},
  {name:'cached session belongs to another account',cachedOwner:other},
  {name:'cached session is missing',cachedOwner:null},
  {name:'server rejects revoked credentials',identityError:{name:'AuthApiError',status:401}},
  {name:'server denies account access',identityError:{name:'AuthApiError',status:403}},
]) {
  test(`startup preserves logs and denies access when ${scenario.name}`,async()=>{
    const state=setup();
    const access=createOfflineAccess(setup().storage);
    const initial=await openAccountSession(state.client,state.storage,access);
    await initial.data.saveUserSettings({unitSystem:'imperial',defaultGoal:'cut'});
    await access.rememberVerifiedAccount(owner);
    initial.close();
    const before=[...state.values];
    const cachedOwner='cachedOwner' in scenario ? scenario.cachedOwner : owner;
    state.client.auth.getUser=async()=>({data:{user:null},error:scenario.identityError??{name:'AuthRetryableFetchError',status:0}});
    state.client.auth.getSession=async()=>({data:{session:cachedOwner?{user:{id:cachedOwner}}:null},error:scenario.sessionError??null});
    await assert.rejects(openAccountSession(state.client,state.storage,access));
    assert.deepEqual([...state.values],before);
  });
}

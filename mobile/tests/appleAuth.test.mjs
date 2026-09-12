import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateCloudConfig, MOBILE_PROJECT_URL } from '../src/cloud/config.ts';
import { runAppleSignIn } from '../src/cloud/appleSignInFlow.ts';

test('only mobile project and publishable keys are accepted', () => {
  assert.deepEqual(validateCloudConfig(MOBILE_PROJECT_URL,'sb_publishable_example'),
    {url:MOBILE_PROJECT_URL,key:'sb_publishable_example'});
  for (const key of ['sb_secret_example','eyJhbGciOi','',undefined]) assert.throws(()=>validateCloudConfig(MOBILE_PROJECT_URL,key));
  assert.throws(()=>validateCloudConfig('https://other.supabase.co','sb_publishable_example'));
});
function mock(){
  const calls=[];let counter=0;
  const deps={random:()=>`random-${++counter}`,sha256:async value=>`hashed-${value}`,
    request:async options=>{calls.push(['apple',options]);return {state:options.state,identityToken:'signed-token'};},
    auth:{signInWithIdToken:async value=>{calls.push(['supabase',value]);return {data:{session:{},user:{id:'user'}},error:null};}}};
  return {deps,calls};
}
test('Apple gets hashed nonce while Supabase gets original nonce',async()=>{
  const {deps,calls}=mock();assert.equal((await runAppleSignIn(deps)).id,'user');
  assert.equal(calls[0][1].nonce,'hashed-random-1');
  assert.equal(calls[0][1].state,'random-2');
  assert.equal(calls[1][1].nonce,'random-1');
  assert.equal(calls[1][1].provider,'apple');
});
test('canceling Apple dialog does not contact Supabase',async()=>{
  const {deps,calls}=mock();deps.request=async()=>{throw {code:'ERR_REQUEST_CANCELED'};};
  assert.equal(await runAppleSignIn(deps),null);assert.equal(calls.length,0);
});
test('mismatched state and missing tokens stop authentication',async()=>{
  for(const credential of [{state:'wrong',identityToken:'token'},{state:'random-2',identityToken:null}]){
    const {deps,calls}=mock();deps.request=async()=>credential;
    await assert.rejects(runAppleSignIn(deps));assert.equal(calls.length,0);
  }
});
test('server authentication errors are not treated as success',async()=>{
  const {deps}=mock();deps.auth.signInWithIdToken=async()=>({data:{},error:new Error('token rejected')});
  await assert.rejects(runAppleSignIn(deps),/token rejected/);
});
test('incomplete sessions are rejected',async()=>{
  const {deps}=mock();deps.auth.signInWithIdToken=async()=>({data:{user:{id:'user'},session:null},error:null});
  await assert.rejects(runAppleSignIn(deps),/did not complete/);
});

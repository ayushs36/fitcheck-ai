import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createDeleteAccountHandler} from '../supabase/functions/delete-account/handler.ts';
function setup(){
  const calls=[];
  const services={
    authenticate:async token=>{calls.push(['authenticate',token]);return {id:'verified-user',appleSubject:'apple-owner'};},
    exchangeAppleCode:async code=>{calls.push(['exchange',code]);return {subject:'apple-owner',refreshToken:'private-refresh'};},
    revokeAppleToken:async token=>{calls.push(['revoke',token]);},
    deleteUser:async id=>{calls.push(['delete',id]);},
  };
  return {calls,services,handler:createDeleteAccountHandler(services)};
}
function request(body={confirmed:true,authorizationCode:'fresh-code'},token='verified-jwt'){
  return new Request('https://example.invalid/delete-account',{method:'POST',headers:token?{authorization:`Bearer ${token}`}:{},body:JSON.stringify(body)});
}
test('verified deletion revokes Apple first and returns no credentials',async()=>{
  const {calls,handler}=setup();
  const result=await handler(request());
  assert.equal(result.status,200);
  assert.deepEqual(await result.json(),{deleted:true});
  assert.deepEqual(calls.map(call=>call[0]),['authenticate','exchange','revoke','delete']);
  assert.equal(calls[3][1],'verified-user');
});
test('unauthenticated requests cannot call deletion services',async()=>{
  const {calls,handler}=setup();
  assert.equal((await handler(request({},null))).status,401);
  assert.equal(calls.length,0);
});
test('client cannot choose the user to delete',async()=>{
  const {calls,handler}=setup();
  assert.equal((await handler(request({confirmed:true,authorizationCode:'fresh-code',userId:'victim'}))).status,400);
  assert.equal(calls.length,1);
});
test('confirmation and a fresh Apple authorization code are mandatory',async()=>{
  const {handler}=setup();
  assert.equal((await handler(request({authorizationCode:'fresh-code'}))).status,400);
  assert.equal((await handler(request({confirmed:true,authorizationCode:''}))).status,400);
});
test('mismatched Apple identity cannot revoke or delete',async()=>{
  const {services,calls,handler}=setup();
  services.exchangeAppleCode=async()=>({subject:'another-user',refreshToken:'other-token'});
  assert.equal((await handler(request())).status,403);
  assert.equal(calls.some(call=>['revoke','delete'].includes(call[0])),false);
});
test('revocation failure preserves account and sanitizes error output',async()=>{
  const {services,calls,handler}=setup();
  services.revokeAppleToken=async()=>{throw new Error('secret-token-debug');};
  const result=await handler(request());
  assert.equal(result.status,503);
  assert.doesNotMatch(await result.text(),/secret-token-debug/);
  assert.equal(calls.some(call=>call[0]==='delete'),false);
});
test('database deletion failure cannot report success',async()=>{
  const {services,handler}=setup();
  services.deleteUser=async()=>{throw new Error('database');};
  const result=await handler(request());
  assert.equal(result.status,503);
  assert.deepEqual(await result.json(),{error:'account_deletion_incomplete',reauthenticateToRetry:true});
});
test('oversized bodies and non-POST requests are rejected',async()=>{
  const {handler}=setup();
  assert.equal((await handler(request({confirmed:true,authorizationCode:'x'.repeat(9000)}))).status,400);
  assert.equal((await handler(new Request('https://example.invalid/delete-account'))).status,405);
});

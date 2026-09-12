import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPair,exportPKCS8,exportJWK,createLocalJWKSet,SignJWT,jwtVerify} from 'jose';
import {createAppleDeletionService} from '../supabase/functions/delete-account/apple.ts';
const clientId='com.ayushs36.fitcheckai';
const signing=await generateKeyPair('ES256',{extractable:true});
const identity=await generateKeyPair('RS256');
const privateKey=await exportPKCS8(signing.privateKey);
const config={teamId:'XRAARJL4BX',keyId:'TESTKEY123',clientId,privateKey};
const verificationKeys=createLocalJWKSet({keys:[{...await exportJWK(identity.publicKey),kid:'apple-test',alg:'RS256'}]});
async function token(options={}) {
  return new SignJWT({}).setProtectedHeader({alg:'RS256',kid:'apple-test'})
    .setSubject('apple-owner').setIssuer(options.issuer??'https://appleid.apple.com')
    .setAudience(options.audience??clientId).setIssuedAt(options.iat??Math.floor(Date.now()/1000))
    .setExpirationTime(options.exp??'5m').sign(identity.privateKey);
}
test('Apple code exchange verifies identity and signs a short-lived server secret',async()=>{
  let sent;
  const idToken=await token();
  const service=await createAppleDeletionService(config,{verificationKeys,fetch:async(url,init)=>{
    sent={url,init};return Response.json({id_token:idToken,refresh_token:'fake-refresh'});
  }});
  assert.deepEqual(await service.exchangeAppleCode('fresh-code'),{subject:'apple-owner',refreshToken:'fake-refresh'});
  assert.equal(sent.url,'https://appleid.apple.com/auth/token');
  assert.equal(sent.init.redirect,'error');
  assert.equal(sent.init.body.get('code'),'fresh-code');
  const verified=await jwtVerify(sent.init.body.get('client_secret'),signing.publicKey,{issuer:config.teamId,audience:'https://appleid.apple.com'});
  assert.equal(verified.payload.sub,clientId);
  assert.ok(verified.payload.exp-verified.payload.iat<=300);
});
test('wrong audience, issuer, expired and old identity tokens are rejected',async()=>{
  for(const options of [{audience:'other.app'},{issuer:'https://example.invalid'},{exp:'-1m'},{iat:Math.floor(Date.now()/1000)-600}]) {
    const idToken=await token(options);
    const service=await createAppleDeletionService(config,{verificationKeys,fetch:async()=>Response.json({id_token:idToken,refresh_token:'fake-refresh'})});
    await assert.rejects(service.exchangeAppleCode('fresh-code'));
  }
});
test('revocation uses refresh token and does not follow redirects',async()=>{
  let sent;
  const service=await createAppleDeletionService(config,{verificationKeys,fetch:async(url,init)=>{sent={url,init};return new Response(null,{status:200});}});
  await service.revokeAppleToken('fake-refresh');
  assert.equal(sent.url,'https://appleid.apple.com/auth/revoke');
  assert.equal(sent.init.body.get('token_type_hint'),'refresh_token');
  assert.equal(sent.init.body.get('token'),'fake-refresh');
  assert.equal(sent.init.redirect,'error');
});
test('Apple HTTP failures cannot be reported as successful revocation',async()=>{
  const service=await createAppleDeletionService(config,{verificationKeys,fetch:async()=>new Response('sensitive upstream text',{status:400})});
  await assert.rejects(service.revokeAppleToken('fake-refresh'),/^Error: Apple request did not complete\.$/);
});
test('server configuration cannot target another app or team',async()=>{
  await assert.rejects(createAppleDeletionService({...config,clientId:'other.app'}));
  await assert.rejects(createAppleDeletionService({...config,teamId:'OTHERTEAM1'}));
});

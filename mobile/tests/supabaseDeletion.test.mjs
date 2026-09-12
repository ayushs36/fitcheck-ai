import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSupabaseDeletionAdapter} from '../supabase/functions/delete-account/supabase.ts';

function setup() {
  const user = {id: 'owner', is_anonymous: false,
    user_metadata: {sub: 'untrusted-subject'},
    identities: [{provider: 'apple', user_id: 'owner', identity_data: {sub: 'verified-apple'}}]};
  const calls = [];
  const auth = {
    getUser: async token => {calls.push(['verify', token]); return {data: {user}, error: null};},
    admin: {deleteUser: async (...args) => {calls.push(['delete', ...args]); return {data: {user}, error: null};}},
  };
  return {user, calls, auth, adapter: createSupabaseDeletionAdapter(auth)};
}

test('deletion uses server-verified Apple identity and hard deletes only verified caller', async () => {
  const {adapter, calls} = setup();
  assert.deepEqual(await adapter.authenticate('access-token'), {id: 'owner', appleSubject: 'verified-apple'});
  await adapter.deleteUser('owner');
  assert.deepEqual(calls, [['verify', 'access-token'], ['delete', 'owner', false]]);
  await assert.rejects(adapter.deleteUser('owner'));
});

test('deletion cannot target an unverified or different account', async () => {
  const {adapter, calls} = setup();
  await assert.rejects(adapter.deleteUser('owner'));
  await adapter.authenticate('access-token');
  await assert.rejects(adapter.deleteUser('another-account'));
  assert.equal(calls.some(call => call[0] === 'delete'), false);
});

test('missing, ambiguous, foreign, or anonymous Apple identity fails closed', async () => {
  for (const modify of [
    user => {user.identities = [];},
    user => {user.identities.push({...user.identities[0]});},
    user => {user.identities[0].user_id = 'another-account';},
    user => {user.identities[0].identity_data = {};},
    user => {user.is_anonymous = true;},
  ]) {
    const {adapter, user} = setup();
    modify(user);
    assert.equal(await adapter.authenticate('access-token'), null);
    await assert.rejects(adapter.deleteUser('owner'));
  }
});

test('failed reauthentication clears previous deletion authorization', async () => {
  const {adapter, auth} = setup();
  await adapter.authenticate('valid-token');
  auth.getUser = async () => ({data: {user: null}, error: {status: 401}});
  assert.equal(await adapter.authenticate('expired-token'), null);
  await assert.rejects(adapter.deleteUser('owner'));
});

test('Supabase service errors stay generic and cannot report deletion success', async () => {
  const {adapter, auth} = setup();
  auth.getUser = async () => ({data: {user: null}, error: {status: 503, message: 'private-details'}});
  await assert.rejects(adapter.authenticate('token'), {message: 'Account verification unavailable.'});
  const second = setup();
  await second.adapter.authenticate('token');
  second.auth.admin.deleteUser = async () => ({error: {message: 'private-details'}});
  await assert.rejects(second.adapter.deleteUser('owner'), {message: 'Account deletion unavailable.'});
});

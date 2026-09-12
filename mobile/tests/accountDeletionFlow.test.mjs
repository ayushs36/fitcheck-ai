import {test} from 'node:test';
import assert from 'node:assert/strict';
import {runAccountDeletion} from '../src/cloud/accountDeletionFlow.ts';

function setup() {
  const calls = [];
  const dependencies = {
    verifyAccount: async () => {calls.push('verify'); return 'owner';},
    random: () => 'random-test-value',
    sha256: async value => `hashed-${value}`,
    requestApple: async options => {calls.push(['apple', options]); return {state: options.state, authorizationCode: 'fresh-code'};},
    deleteRemote: async body => {calls.push(['delete', body]); return {deleted: true};},
  };
  return {calls, dependencies};
}
test('deletion requires confirmation before authentication or network requests', async () => {
  const {calls, dependencies} = setup();
  await assert.rejects(runAccountDeletion('owner', false, dependencies));
  assert.deepEqual(calls, []);
});
test('fresh Apple confirmation verifies account before and after prompt', async () => {
  const {calls, dependencies} = setup();
  assert.equal(await runAccountDeletion('owner', true, dependencies), 'deleted');
  assert.deepEqual(calls, ['verify', ['apple', {state: 'random-test-value', nonce: 'hashed-random-test-value'}],
    'verify', ['delete', {confirmed: true, authorizationCode: 'fresh-code'}]]);
});
test('cancelled Apple prompt does not call deletion endpoint', async () => {
  const {calls, dependencies} = setup();
  dependencies.requestApple = async () => {throw {code: 'ERR_REQUEST_CANCELED'};};
  assert.equal(await runAccountDeletion('owner', true, dependencies), 'cancelled');
  assert.deepEqual(calls, ['verify']);
});
test('account switching while Apple prompt is open blocks deletion', async () => {
  const {calls, dependencies} = setup();
  let count = 0;
  dependencies.verifyAccount = async () => ++count === 1 ? 'owner' : 'another-user';
  await assert.rejects(runAccountDeletion('owner', true, dependencies), /account changed/);
  assert.equal(calls.some(call => Array.isArray(call) && call[0] === 'delete'), false);
});
test('missing code and mismatched state cannot reach deletion endpoint', async () => {
  for (const credential of [{state: 'wrong', authorizationCode: 'code'}, {state: 'random-test-value', authorizationCode: null}]) {
    const {calls, dependencies} = setup();
    dependencies.requestApple = async () => credential;
    await assert.rejects(runAccountDeletion('owner', true, dependencies), /could not be verified/);
    assert.equal(calls.some(call => Array.isArray(call) && call[0] === 'delete'), false);
  }
});
test('only explicit server deletion success is accepted', async () => {
  for (const result of [null, {}, {deleted: false}, {deleted: 'true'}, {error: 'account_deletion_incomplete'}]) {
    const {dependencies} = setup();
    dependencies.deleteRemote = async () => result;
    await assert.rejects(runAccountDeletion('owner', true, dependencies), /did not confirm/);
  }
});
test('lost deletion response is uncertain, not reported as successful or rolled back', async () => {
  const {dependencies} = setup();
  dependencies.deleteRemote = async () => {throw new Error('private-token');};
  await assert.rejects(runAccountDeletion('owner', true, dependencies), {message:
    'Account deletion could not be confirmed. Device records were retained; check your connection before trying again.'});
});

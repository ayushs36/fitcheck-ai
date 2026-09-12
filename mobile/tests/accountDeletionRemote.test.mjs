import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createAccountDeletionRemote} from '../src/cloud/accountDeletionRemote.ts';
function setup() {
  const calls = [];
  const client = {
    auth: {
      getSession: async () => ({data: {session: {user: {id: 'owner'}, access_token: 'verified-token'}}, error: null}),
      getUser: async token => {calls.push(['verify', token]); return {data: {user: {id: 'owner'}}, error: null};},
    },
    functions: {invoke: async (...args) => {calls.push(['invoke', ...args]); return {data: {deleted: true}, error: null};}},
  };
  return {client, calls, remote: createAccountDeletionRemote(client, 'owner')};
}
const body = {confirmed: true, authorizationCode: 'fresh-code'};
test('deletion invocation explicitly uses the remotely verified caller token', async () => {
  const {calls, remote} = setup();
  assert.deepEqual(await remote.deleteRemote(body), {deleted: true});
  assert.deepEqual(calls, [['verify', 'verified-token'], ['invoke', 'delete-account', {
    body, headers: {Authorization: 'Bearer verified-token'},
  }]]);
});
test('stale token and account switch block the function request', async () => {
  for (const session of [{user: {id: 'other'}, access_token: 'other-token'}, {user: {id: 'owner'}, access_token: 'refreshed-token'}, null]) {
    const {client, calls, remote} = setup();
    let count = 0;
    const original = client.auth.getSession;
    client.auth.getSession = async () => ++count === 1 ? original() : {data: {session}, error: null};
    await assert.rejects(remote.deleteRemote(body));
    assert.equal(calls.some(call => call[0] === 'invoke'), false);
  }
});
test('unverified identity cannot invoke deletion', async () => {
  const {client, calls, remote} = setup();
  client.auth.getUser = async () => ({data: {user: {id: 'other'}}, error: null});
  await assert.rejects(remote.deleteRemote(body));
  assert.deepEqual(calls, []);
});
test('function failures cannot leak server error details or report success', async () => {
  const {client, remote} = setup();
  client.functions.invoke = async () => ({data: null, error: {message: 'private-details'}});
  await assert.rejects(remote.deleteRemote(body), {message: 'Account deletion could not be confirmed.'});
});

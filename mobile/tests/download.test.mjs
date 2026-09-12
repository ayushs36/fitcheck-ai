import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCloudRecordStore } from '../src/cloud/recordStore.ts';

const owner = '00000000-0000-0000-0000-000000000001';
const other = '00000000-0000-0000-0000-000000000002';
const row = { user_id: owner, kind: 'workout', record_id: 'a',
  payload: {}, deleted: true, revision: 2 };
function mock(rows, owners = [owner, owner], error = null) {
  const calls = [];
  let check = 0;
  const query = {
    select: () => query,
    eq: (...args) => { calls.push(['eq', ...args]); return query; },
    order: (...args) => { calls.push(['order', ...args]); return query; },
    limit: value => { calls.push(['limit', value]); return query; },
    gt: (...args) => { calls.push(['gt', ...args]); return query; },
    then: (resolve, reject) => Promise.resolve({data: rows, error}).then(resolve, reject),
  };
  return { calls, client: {
    auth: { getUser: async () => ({data: {user: {id: owners[check++]}}, error: null}) },
    from: () => query,
  }};
}
test('downloads filter owner and kind and preserve deletion markers', async () => {
  const {client, calls} = mock([row]);
  const result = await createCloudRecordStore(client, owner).downloadPage('workout');
  assert.deepEqual(result, {records: [row], nextCursor: null});
  assert.ok(calls.some(call => call[0] === 'eq' && call[1] === 'user_id' && call[2] === owner));
  assert.ok(calls.some(call => call[0] === 'eq' && call[1] === 'kind' && call[2] === 'workout'));
});
test('full pages return a cursor and next page uses keyset filtering', async () => {
  const rows = Array.from({length: 100}, (_, i) => ({...row, record_id: `w${String(i).padStart(3, '0')}`}));
  const first = await createCloudRecordStore(mock(rows).client, owner).downloadPage('workout');
  assert.equal(first.nextCursor, 'w099');
  const {client, calls} = mock([]);
  assert.equal((await createCloudRecordStore(client, owner).downloadPage('workout', first.nextCursor)).nextCursor, null);
  assert.ok(calls.some(call => call[0] === 'gt' && call[2] === 'w099'));
});
test('account change during download discards the result', async () => {
  await assert.rejects(createCloudRecordStore(mock([row], [owner, other]).client, owner).downloadPage('workout'), /Account changed/);
});
test('foreign, duplicate, wrong-kind and malformed rows reject the whole page', async () => {
  for (const rows of [[{...row, user_id: other}], [row, row], [{...row, kind: 'settings'}], [{...row, revision: 0}], [{...row, deleted: false}]]) {
    await assert.rejects(createCloudRecordStore(mock(rows).client, owner).downloadPage('workout'));
  }
});
test('network failures do not return an empty successful download', async () => {
  await assert.rejects(createCloudRecordStore(mock(null, [owner], new Error('offline')).client, owner).downloadPage('workout'), /offline/);
});

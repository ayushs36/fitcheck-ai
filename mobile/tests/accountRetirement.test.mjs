import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createAccountWorkspace} from '../src/cloud/workspace.ts';
import {accountStorageKey} from '../src/storage/accountStorage.ts';
const owner = '00000000-0000-0000-0000-000000000001';
const other = '00000000-0000-0000-0000-000000000002';
const edit = {kind: 'daily_log', recordId: '2026-09-11', payload: {
  id: 'fictional-log', date: '2026-09-11', goal: 'cut', weightLbs: 140,
  createdAt: '2026-09-11T12:00:00Z', updatedAt: '2026-09-11T12:00:00Z',
}, deleted: false, expectedRevision: null};
function setup() {
  const values = new Map();
  const storage = {getItem: async key => values.get(key) ?? null, setItem: async (key, value) => {values.set(key, value);}};
  return {values, storage, workspace: createAccountWorkspace(storage, owner)};
}
test('retirement clears only the confirmed account active workspace', async () => {
  const {values, storage, workspace} = setup();
  const retained = new Map([
    ['fitcheck-mobile:logs:v1', 'original-device-data'],
    [`${accountStorageKey(owner)}:before-import`, 'original-backup'],
    [accountStorageKey(owner), 'import-snapshot'],
    [`${accountStorageKey(other)}:workspace:v1`, 'other-account'],
  ]);
  for (const [key, value] of retained) values.set(key, value);
  await workspace.edit(edit);
  await workspace.retireAfterConfirmedDeletion({userId: owner, deleted: true});
  for (const [key, value] of retained) assert.equal(values.get(key), value);
  assert.deepEqual(JSON.parse(values.get(`${accountStorageKey(owner)}:workspace:v1`)), {version: 1, ownerId: owner, accountDeleted: true});
  await assert.rejects(createAccountWorkspace(storage, owner).snapshot(), /account was deleted/);
});
test('unconfirmed or foreign deletion receipts do not change cached data', async () => {
  const {values, workspace} = setup();
  await workspace.edit(edit);
  const before = [...values];
  for (const receipt of [{userId: owner, deleted: false}, {userId: other, deleted: true}]) {
    await assert.rejects(workspace.retireAfterConfirmedDeletion(receipt));
    assert.deepEqual([...values], before);
  }
});
test('queued writes from another workspace instance cannot resurrect a retired account', async () => {
  const {storage, workspace} = setup();
  const delayed = createAccountWorkspace(storage, owner);
  const retirement = workspace.retireAfterConfirmedDeletion({userId: owner, deleted: true});
  const lateWrite = delayed.edit(edit);
  await retirement;
  await assert.rejects(lateWrite, /account was deleted/);
  await assert.rejects(delayed.receive([]), /account was deleted/);
  await assert.rejects(delayed.importVerifiedBackup(), /already exists/);
});
test('retirement is retryable and failed persistence cannot report cleanup success', async () => {
  const {storage, workspace} = setup();
  const save = storage.setItem;
  storage.setItem = async () => {};
  await assert.rejects(workspace.retireAfterConfirmedDeletion({userId: owner, deleted: true}), /could not be verified/);
  storage.setItem = save;
  await workspace.retireAfterConfirmedDeletion({userId: owner, deleted: true});
  await workspace.retireAfterConfirmedDeletion({userId: owner, deleted: true});
  await assert.rejects(workspace.snapshot(), /account was deleted/);
});

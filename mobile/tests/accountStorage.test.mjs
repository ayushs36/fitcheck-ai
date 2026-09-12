import { test } from 'node:test';
import assert from 'node:assert/strict';
import { accountStorageKey, createAccountMigration } from '../src/storage/accountStorage.ts';

const user = '00000000-0000-0000-0000-000000000001';
const other = '00000000-0000-0000-0000-000000000002';
const log = { id:'log-1', date:'2026-09-10', goal:'cut', weightLbs:135,
  createdAt:'2026-09-10T12:00:00Z',updatedAt:'2026-09-10T12:00:00Z' };
const snapshot = { logs: JSON.stringify([log]), workouts: '[]', settings: null };
function memory() {
  const values = new Map();
  return { values, getItem: async key => values.get(key) ?? null,
    setItem: async (key, value) => { values.set(key, value); } };
}

test('account keys are isolated and reject local/unverified identifiers', () => {
  assert.notEqual(accountStorageKey(user), accountStorageKey(other));
  assert.throws(() => accountStorageKey('local-123'));
  assert.throws(() => accountStorageKey('someone@example.com'));
});
test('consent is required without writing anything', async () => {
  const store = memory();
  await assert.rejects(createAccountMigration(store)(user, snapshot, false));
  assert.equal(store.values.size, 0);
});
test('backup precedes import and missing metrics stay missing', async () => {
  const store = memory();
  const result = await createAccountMigration(store)(user, snapshot, true);
  assert.equal(store.values.get(result.backupKey), store.values.get(result.key));
  assert.deepEqual(JSON.parse(JSON.parse(store.values.get(result.key)).logs), [log]);
});
test('existing account data is never overwritten', async () => {
  const store = memory();
  store.values.set(accountStorageKey(user), 'existing');
  await assert.rejects(createAccountMigration(store)(user, snapshot, true));
  assert.equal(store.values.get(accountStorageKey(user)), 'existing');
});
test('invalid JSON stops import before any write', async () => {
  const store = memory();
  await assert.rejects(createAccountMigration(store)(user, {...snapshot, logs:'broken'}, true));
  assert.equal(store.values.size, 0);
});
test('backup failure prevents destination write', async () => {
  const store = memory();
  store.setItem = async () => { throw new Error('disk full'); };
  await assert.rejects(createAccountMigration(store)(user, snapshot, true));
  assert.equal(store.values.size, 0);
});
test('concurrent imports cannot overwrite one another', async () => {
  const store = memory();
  const migrate = createAccountMigration(store);
  const results = await Promise.allSettled([migrate(user,snapshot,true), migrate(user,snapshot,true)]);
  assert.deepEqual(results.map(x=>x.status), ['fulfilled','rejected']);
});
test('interrupted import preserves backup and permits identical retry', async () => {
  const store = memory();
  const write = store.setItem;
  store.setItem = async (key,value) => {
    if (key === accountStorageKey(user)) throw new Error('interrupted');
    await write(key,value);
  };
  const migrate = createAccountMigration(store);
  await assert.rejects(migrate(user,snapshot,true));
  assert.equal(store.values.size, 2);
  store.setItem = write;
  await migrate(user,snapshot,true);
  assert.equal(store.values.size, 3);
});

test('legacy source cannot be imported into another account', async () => {
  const store = memory();
  await createAccountMigration(store)(user, snapshot, true);
  await assert.rejects(createAccountMigration(store)(other, snapshot, true), /another account/);
  assert.equal(await store.getItem(accountStorageKey(other)), null);
});

test('separate helper instances serialize imports on the same storage adapter', async () => {
  const store = memory();
  const results = await Promise.allSettled([
    createAccountMigration(store)(user, snapshot, true),
    createAccountMigration(store)(other, snapshot, true),
  ]);
  assert.deepEqual(results.map(result => result.status), ['fulfilled', 'rejected']);
  assert.equal(await store.getItem(accountStorageKey(other)), null);
});

test('destination failure keeps ownership reserved and original data untouched', async () => {
  const store = memory();
  store.values.set('fitcheck-mobile:daily-logs:v1', snapshot.logs);
  const write = store.setItem;
  store.setItem = async (key, value) => {
    if (key === accountStorageKey(user)) throw new Error('disk full');
    await write(key, value);
  };
  await assert.rejects(createAccountMigration(store)(user, snapshot, true));
  await assert.rejects(createAccountMigration(store)(other, snapshot, true), /another account/);
  assert.equal(await store.getItem('fitcheck-mobile:daily-logs:v1'), snapshot.logs);
});

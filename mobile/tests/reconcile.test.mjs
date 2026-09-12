import {test} from 'node:test';
import assert from 'node:assert/strict';
import {reconcileCloudRecords} from '../src/cloud/reconcile.ts';
const owner='00000000-0000-0000-0000-000000000001';
const row={user_id:owner,kind:'daily_log',record_id:'2026-09-10',revision:1,deleted:false,
  payload:{id:'l',date:'2026-09-10',goal:'cut',calories:2000,createdAt:'2026-09-10T12:00:00Z',updatedAt:'2026-09-10T12:00:00Z'}};
const edit={kind:row.kind,recordId:row.record_id,payload:{...row.payload,calories:2200},deleted:false,expectedRevision:1,sequence:1};
test('remote changes do not overwrite pending local edits',()=>{
  const result=reconcileCloudRecords(owner,[row],[edit],[{...row,revision:2}]);
  assert.equal(result.conflicts.length,1);assert.equal(result.pending[0].payload.calories,2200);
  assert.equal(result.records[0].revision,1);
});
test('same-base download is not a conflict',()=>{
  assert.equal(reconcileCloudRecords(owner,[row],[edit],[row]).conflicts.length,0);
});
test('tombstones replace synced cache but cannot overwrite offline edits',()=>{
  const deleted={...row,revision:2,deleted:true,payload:{}};
  assert.equal(reconcileCloudRecords(owner,[row],[],[deleted]).records[0].deleted,true);
  assert.equal(reconcileCloudRecords(owner,[row],[edit],[deleted]).conflicts.length,1);
});
test('stale downloads and incomplete pages never erase newer cached data',()=>{
  assert.equal(reconcileCloudRecords(owner,[{...row,revision:3}],[],[row]).records[0].revision,3);
  assert.equal(reconcileCloudRecords(owner,[row],[],[]).records.length,1);
});
test('wrong-owner and malformed downloads reject the entire plan',()=>{
  assert.throws(()=>reconcileCloudRecords(owner,[row],[],[{...row,user_id:'another-user'}]));
  assert.throws(()=>reconcileCloudRecords(owner,[row],[],[{...row,payload:{}}]));
  assert.equal(row.payload.calories,2000);
});
test('duplicate cloud rows require investigation instead of silent overwrite',()=>{
  assert.throws(()=>reconcileCloudRecords(owner,[],[],[row,row]));
});

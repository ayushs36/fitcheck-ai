import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseWebLogExport} from '../src/cloud/webLogImport.ts';
import {createAccountWorkspace,visibleWorkspaceRecords} from '../src/cloud/workspace.ts';
import {accountStorageKey} from '../src/storage/accountStorage.ts';
import {createMobileLogExport} from '../../lib/mobileLogExport.ts';
const owner='00000000-0000-0000-0000-000000000001';
const other='00000000-0000-0000-0000-000000000002';
const row={date:'2026-09-01',goal:'Maintaining',weight:135,calories:0,protein:null,steps:0,
  workout:'Custom Push',exercises:[{name:'Push-up',sets:3,reps:12,weight:0}]};
const exportFile=(rows=[row])=>JSON.stringify({format:'fitcheck-personal-logs',version:1,units:'lb',logs:rows});
function memory() {
  const values=new Map();
  return {values,getItem:async key=>values.get(key)??null,setItem:async(key,value)=>{values.set(key,value);}};
}
test('real web export round-trips into mobile without mutating sources or exporting extra private fields',()=>{
  const logs=[{...row,id:'original',extraSecret:'must-not-export'}];
  const history=[{id:'phase',goal:'Bulking',startedAt:'2026-08-01T00:00:00Z',source:'Today goal selector'}];
  const before=JSON.stringify({logs,history});
  const raw=createMobileLogExport(logs,'Cutting',history,'2026-09-13T12:00:00Z');
  assert.equal(raw.includes('must-not-export'),false);
  assert.equal(JSON.stringify({logs,history}),before);
  const result=parseWebLogExport(raw);
  assert.equal(result.logs[0].goal,'bulk');
  assert.equal(result.assumedGoalDays,0);
  assert.equal(result.workouts[0].exercises[0].sets.length,3);
});
test('web export discloses missing historical goals and uses the latest matching phase',()=>{
  const history=[{id:'cut',goal:'Cutting',startedAt:'2026-09-01T12:00:00Z',endedAt:'2026-09-03T12:00:00Z'},
    {id:'bulk',goal:'Bulking',startedAt:'2026-09-03T12:00:00Z'}];
  const raw=createMobileLogExport([{...row,date:'2026-08-01'},{...row,date:'2026-09-03'}],'Maintaining',history,'2026-09-13T12:00:00Z');
  const result=parseWebLogExport(raw);
  assert.deepEqual(result.logs.map(log=>log.goal),['maintain','bulk']);
  assert.equal(result.assumedGoalDays,1);
});
test('web import preserves dates, custom names, per-set reps and zero exercise load without inventing nutrition',()=>{
  const result=parseWebLogExport(exportFile());
  assert.equal(result.logs[0].weightLbs,135);
  assert.equal(result.logs[0].goal,'maintain');
  for (const key of ['calories','proteinGrams','steps']) assert.equal(key in result.logs[0],false);
  assert.equal(result.workouts[0].type,'Custom Push');
  assert.equal(result.workouts[0].exercises[0].sets.length,3);
  assert.equal(result.workouts[0].exercises[0].sets[0].reps,12);
  assert.equal(result.workouts[0].exercises[0].sets[0].weightLbs,0);
  assert.equal('isBodyweight' in result.workouts[0].exercises[0].sets[0],false);
});
test('nutrition-only days remain weightless and goal assumptions are disclosed',()=>{
  const result=parseWebLogExport(exportFile([{...row,weight:null,calories:2200,protein:140,goalAssumed:true,exercises:[]} ]));
  assert.equal('weightLbs' in result.logs[0],false);
  assert.equal(result.logs[0].calories,2200);
  assert.equal(result.assumedGoalDays,1);
  assert.equal(result.workouts.length,0);
});
test('invalid format, dates, metrics, duplicated dates and malformed exercises reject the whole file',()=>{
  for (const raw of ['{}',JSON.stringify({format:'demo',logs:[row]}),exportFile([row,row]),
    exportFile([{...row,date:'2026-02-30'}]),exportFile([{...row,steps:2.5}]),
    exportFile([{...row,weight:-2}]),exportFile([{...row,goal:'toString'}]),
    exportFile([{...row,exercises:[{name:'Lift',sets:0,reps:12,weight:20}]}]),
    ' '.repeat(5*1024*1024+1)]) assert.throws(()=>parseWebLogExport(raw));
});
test('confirmed import is atomic, account-scoped, backed up, and repeat-safe',async()=>{
  const storage=memory();
  storage.values.set(`${accountStorageKey(other)}:workspace:v1`,'unrelated');
  storage.values.set('fitcheck-mobile:logs:v1','legacy');
  const workspace=createAccountWorkspace(storage,owner), input=parseWebLogExport(exportFile());
  const plan=await workspace.previewWebImport(input);
  assert.equal(storage.values.size,2);
  await workspace.importWebLogs(input,plan.dates,()=>{});
  const state=await workspace.snapshot();
  assert.equal(state.pending.length,2);
  assert.equal(visibleWorkspaceRecords(state).length,2);
  assert.equal(storage.values.get(`${accountStorageKey(other)}:workspace:v1`),'unrelated');
  assert.equal(storage.values.get('fitcheck-mobile:logs:v1'),'legacy');
  const backup=[...storage.values].find(([key])=>key.includes(':before-web-import:'));
  assert.equal(JSON.parse(backup[1]).pending.length,0);
  const before=[...storage.values];
  const repeated=await workspace.previewWebImport(input);
  assert.deepEqual(repeated.dates,[]);
  await workspace.importWebLogs(input,[],()=>{});
  assert.deepEqual([...storage.values],before);
});
test('a date with an existing workout or deleted record is not imported',async()=>{
  for (const kind of ['workout','daily_log']) {
    const workspace=createAccountWorkspace(memory(),owner), input=parseWebLogExport(exportFile());
    const payload=kind==='workout'?input.workouts[0]:input.logs[0];
    await workspace.edit({kind,recordId:kind==='workout'?'existing-workout':row.date,payload,deleted:true,expectedRevision:null});
    assert.deepEqual((await workspace.previewWebImport(input)).dates,[]);
  }
});
test('changed preview and failed recovery backup cannot alter the workspace',async()=>{
  const storage=memory(), workspace=createAccountWorkspace(storage,owner), input=parseWebLogExport(exportFile());
  await assert.rejects(workspace.importWebLogs(input,[],()=>{}),/Preview|preview/);
  assert.equal(storage.values.size,0);
  storage.setItem=async()=>{throw Error('storage full');};
  await assert.rejects(workspace.importWebLogs(input,[row.date],()=>{}),/storage full/);
  assert.equal(storage.values.size,0);
});
test('failed workspace save retains the recovery copy and a retry adds each record once',async()=>{
  const storage=memory(), write=storage.setItem;
  const workspace=createAccountWorkspace(storage,owner), input=parseWebLogExport(exportFile());
  storage.setItem=async(key,value)=>{if(key.endsWith(':workspace:v1')) throw Error('save failed'); await write(key,value);};
  await assert.rejects(workspace.importWebLogs(input,[row.date],()=>{}),/save failed/);
  assert.equal(storage.values.size,1);
  assert.deepEqual(visibleWorkspaceRecords(await workspace.snapshot()),[]);
  storage.setItem=write;
  await workspace.importWebLogs(input,[row.date],()=>{});
  assert.equal((await workspace.snapshot()).pending.length,2);
});
test('session closure during backup prevents the import commit',async()=>{
  const storage=memory(), write=storage.setItem;
  const workspace=createAccountWorkspace(storage,owner), input=parseWebLogExport(exportFile());
  let closed=false;
  storage.setItem=async(key,value)=>{await write(key,value);closed=true;};
  await assert.rejects(workspace.importWebLogs(input,[row.date],()=>{if(closed) throw Error('session closed');}),/session closed/);
  assert.equal(storage.values.has(`${accountStorageKey(owner)}:workspace:v1`),false);
});

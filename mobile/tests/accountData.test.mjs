import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createAccountWorkspace} from '../src/cloud/workspace.ts';
import {createAccountData} from '../src/cloud/accountData.ts';
const owner='00000000-0000-0000-0000-000000000001';
const log={id:'log',date:'2026-09-11',goal:'cut',weightLbs:135,createdAt:'2026-09-11T12:00:00Z',updatedAt:'2026-09-11T12:00:00Z'};
function setup(){
  const values=new Map();
  const workspace=createAccountWorkspace({getItem:async key=>values.get(key)??null,setItem:async(key,value)=>{values.set(key,value);}},owner);
  return {workspace,data:createAccountData(workspace)};
}
test('daily save, edit and delete use a single pending record',async()=>{
  const {workspace,data}=setup();
  await data.upsertDailyLog(log);
  assert.equal((await data.loadDailyLogs())[0].calories,undefined);
  await data.upsertDailyLog({...log,calories:2200});
  assert.equal((await workspace.snapshot()).pending.length,1);
  await data.deleteDailyLogByDate(log.date);
  assert.deepEqual(await data.loadDailyLogs(),[]);
  assert.equal((await workspace.snapshot()).pending[0].deleted,true);
});
test('bodyweight and form-focused workouts retain all set details',async()=>{
  const {data}=setup();
  const workout={id:'workout',date:log.date,type:'Push',createdAt:log.createdAt,updatedAt:log.updatedAt,
    exercises:[{id:'exercise',name:'Push-up',sets:[{id:'set',reps:12,isBodyweight:true,formFocus:true}]}]};
  await data.upsertWorkoutSession(workout);
  assert.deepEqual(await data.loadWorkoutSessions(),[workout]);
  await data.deleteWorkoutSessionById(workout.id);
  assert.deepEqual(await data.loadWorkoutSessions(),[]);
});
test('settings persist and invalid records do not change existing data',async()=>{
  const {data}=setup();
  const settings={unitSystem:'imperial',defaultGoal:'maintain'};
  await data.saveUserSettings(settings);
  assert.deepEqual(await data.loadUserSettings(),settings);
  await assert.rejects(data.upsertDailyLog({...log,weightLbs:-1}));
  assert.deepEqual(await data.loadDailyLogs(),[]);
});
test('closed account rejects old callbacks and reads without changing records',async()=>{
  const {workspace,data}=setup();
  await data.upsertDailyLog(log);
  const before=await workspace.snapshot();
  const lateSave=data.upsertDailyLog;
  data.close();
  await assert.rejects(lateSave({...log,calories:2200}),/session closed/);
  await assert.rejects(data.loadDailyLogs(),/session closed/);
  assert.deepEqual(await workspace.snapshot(),before);
});
test('queued writes are canceled if session closes before they begin',async()=>{
  const {data,workspace}=setup();
  const pending=data.upsertDailyLog(log);
  data.close();
  await assert.rejects(pending,/session closed/);
  assert.equal((await workspace.snapshot()).pending.length,0);
});

test('an old screen draft cannot overwrite a newer synchronized record',async()=>{
  const {data,workspace}=setup();
  await workspace.receive([{user_id:owner,kind:'daily_log',record_id:log.date,payload:log,deleted:false,revision:1}]);
  const original=(await data.loadDailyLogs())[0];
  await workspace.receive([{user_id:owner,kind:'daily_log',record_id:log.date,payload:{...log,steps:9000},deleted:false,revision:2}]);
  await assert.rejects(data.upsertDailyLog({...log,calories:2200},original),/changed since you opened/);
  assert.equal((await data.loadDailyLogs())[0].steps,9000);
  assert.equal((await workspace.snapshot()).pending.length,0);
});

test('equivalent record key ordering does not create a false stale-draft error',async()=>{
  const {data}=setup();
  await data.upsertDailyLog(log);
  const reordered=Object.fromEntries(Object.entries(log).reverse());
  await data.upsertDailyLog({...log,calories:2200},reordered);
  assert.equal((await data.loadDailyLogs())[0].calories,2200);
});

test('an old deletion confirmation cannot remove a changed log',async()=>{
  const {data,workspace}=setup();
  await data.upsertDailyLog(log);
  await data.upsertDailyLog({...log,steps:9000});
  await assert.rejects(data.deleteDailyLogByDate(log.date,log),/changed since you opened/);
  assert.equal((await data.loadDailyLogs())[0].steps,9000);
  assert.equal((await workspace.snapshot()).pending[0].deleted,false);
});

test('an old workout confirmation cannot remove a changed session',async()=>{
  const {data}=setup();
  const workout={id:'workout',date:log.date,type:'Push',createdAt:log.createdAt,updatedAt:log.updatedAt,exercises:[]};
  await data.upsertWorkoutSession(workout);
  await data.upsertWorkoutSession({...workout,notes:'Updated form notes'});
  await assert.rejects(data.deleteWorkoutSessionById(workout.id,workout),/changed since you opened/);
  assert.equal((await data.loadWorkoutSessions())[0].notes,'Updated form notes');
});

test('goal saves preserve newer settings and fresh onboarding cannot replace them',async()=>{
  const {data}=setup();
  const original={unitSystem:'imperial',defaultGoal:'cut'};
  await data.saveUserSettings(original,null);
  await data.saveUserSettings({...original,defaultGoal:'maintain'},original);
  await assert.rejects(data.saveUserSettings({...original,calorieTarget:2200},original),/changed since you opened/);
  await assert.rejects(data.saveUserSettings(original,null),/changed since you opened/);
  assert.equal((await data.loadUserSettings()).defaultGoal,'maintain');
});

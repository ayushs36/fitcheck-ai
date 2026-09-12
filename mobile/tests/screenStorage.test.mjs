import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createAccountScreenStorage} from '../src/cloud/screenStorage.ts';
import {createAccountData} from '../src/cloud/accountData.ts';
import {createAccountWorkspace} from '../src/cloud/workspace.ts';
const owner='00000000-0000-0000-0000-000000000001';
const log={id:'log',date:'2026-09-11',goal:'cut',weightLbs:135,createdAt:'2026-09-11T12:00:00Z',updatedAt:'2026-09-11T12:00:00Z'};
function setup(){
  const values=new Map();
  const data=createAccountData(createAccountWorkspace({getItem:async key=>values.get(key)??null,setItem:async(key,value)=>{values.set(key,value);}},owner));
  let saves=0;
  return {data,storage:createAccountScreenStorage({data,signOut:async()=>data.close()},()=>{saves++;}),saves:()=>saves};
}
test('screen save queues sync only after a successful local save',async()=>{
  const {storage,saves}=setup();
  await storage.upsertDailyLog(log);
  assert.equal(saves(),1);
  assert.deepEqual(await storage.getDailyLogByDate(log.date),log);
  await assert.rejects(storage.upsertDailyLog({...log,weightLbs:-1}));
  assert.equal(saves(),1);
});
test('bulk reset, legacy profile edits and replacement imports fail closed',async()=>{
  const {storage}=setup();
  await storage.upsertDailyLog(log);
  for(const action of [()=>storage.clearMobileData(),()=>storage.restoreMobileDataBackup({}),()=>storage.saveDailyLogs([]),()=>storage.saveWorkoutSessions([]),()=>storage.saveMobileAccount({})]) await assert.rejects(action());
  assert.deepEqual(await storage.loadDailyLogs(),[log]);
});
test('account backup exports coherent records without a legacy account profile',async()=>{
  const {storage}=setup();
  await storage.upsertDailyLog(log);
  const backup=await storage.loadMobileDataBackup();
  assert.deepEqual(backup.logs,[log]);
  assert.equal(backup.account,null);
  await storage.clearMobileAccount();
  await assert.rejects(storage.loadDailyLogs(),/session closed/);
});

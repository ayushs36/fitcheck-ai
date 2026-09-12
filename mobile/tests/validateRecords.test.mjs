import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isDailyLog, isWorkoutSession, isUserSettings, validateRecordArray } from '../src/storage/validateRecords.ts';
const log = {id:'1',date:'2026-09-10',goal:'cut',createdAt:'2026-09-10T12:00:00Z',updatedAt:'2026-09-10T12:00:00Z'};
test('partial logs allow missing metrics and genuine zero values',()=>{
  assert.equal(isDailyLog(log),true);
  assert.equal(isDailyLog({...log,calories:0,steps:0}),true);
  assert.equal(isDailyLog({...log,proteinGrams:100}),true);
});
test('malformed records, invalid dates and invalid numeric values are rejected',()=>{
  for(const patch of [{date:'2026-02-30'},{steps:-1},{steps:1.5},{calories:'2000'},
    {weightLbs:0},{goal:'unknown'},{proteinGrams:NaN},{calories:null}]) {
    assert.equal(isDailyLog({...log,...patch}),false);
  }
});
test('duplicate daily dates cannot silently overwrite one another',()=>{
  assert.throws(()=>validateRecordArray([log,{...log,id:'2'}],isDailyLog,x=>x.date));
});
test('bodyweight and form-focused sets validate without weights',()=>{
  const workout={id:'w',date:log.date,type:'My workout',createdAt:log.createdAt,updatedAt:log.updatedAt,
    exercises:[{id:'e',name:'Push-up',sets:[{id:'s',reps:10,isBodyweight:true,formFocus:true}]}]};
  assert.equal(isWorkoutSession(workout),true);
  workout.exercises[0].sets[0].reps=-1;
  assert.equal(isWorkoutSession(workout),false);
});
test('goal settings require a valid unit system and goal',()=>{
  assert.equal(isUserSettings({unitSystem:'imperial',defaultGoal:'maintain'}),true);
  assert.equal(isUserSettings({unitSystem:'imperial',defaultGoal:'bulk',stepTarget:-1}),false);
  assert.equal(isUserSettings({}),false);
});

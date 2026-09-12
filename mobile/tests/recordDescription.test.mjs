import {test} from 'node:test';
import assert from 'node:assert/strict';
import {describeRecord} from '../src/cloud/recordDescription.ts';
test('conflict descriptions distinguish missing values from real zeros',()=>{
  const text=describeRecord({id:'l',date:'2026-09-11',goal:'maintain',steps:0,createdAt:'2026-09-11T12:00:00Z',updatedAt:'2026-09-11T12:00:00Z'},false);
  assert.match(text,/Steps: 0/);
  assert.match(text,/Goal: Maintaining/);
  assert.doesNotMatch(text,/Calories/);
});
test('deleted records are clearly labeled',()=>assert.equal(describeRecord({},true),'Deleted record'));

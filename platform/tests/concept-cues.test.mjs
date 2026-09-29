import {test} from 'node:test';
import assert from 'node:assert/strict';
import {conceptCue} from '../lib/curriculum/concept-cues.ts';
const f=(vars,event='line')=>({vars,event,line:8,function:'solve',stack:[]});
const input={nums:[1,12,-5,-6,50,3],k:4};
test('window explains pending operations and recorded checkpoints',()=>{
 const before=f({right:4,left:0,total:2});
 const next=conceptCue('maximum-average-subarray',before,undefined,input,'total += nums[right] - nums[left]');
 assert.equal(next.equation,'2 − (1) + (50) = 51');
 assert.deepEqual(next.marks,{0:'leaves',4:'enters'});
 assert.equal(conceptCue('maximum-average-subarray',f({right:4,left:1,total:51},'checkpoint'),before,input,'trace(').equation,next.equation);
});
test('custom states and boundaries do not invent a window update',()=>{
 assert.equal(conceptCue('maximum-average-subarray',f({right:4,total:123}),undefined,input,'total += nums[right] - nums[left]'),undefined);
 assert.equal(conceptCue('maximum-average-subarray',f({right:4,total:51},'complete'),undefined,input,''),undefined);
});
test('binary search rejects stale middle and unsorted arrays',()=>{
 const data={nums:[1,3,5,7,9,11,13],target:11},v={left:0,right:6,mid:3};
 assert.equal(conceptCue('binary-search-standard',f(v),undefined,data,'if nums[mid] < target:').marks[0],'can skip');
 assert.equal(conceptCue('binary-search-standard',f({...v,left:4}),undefined,data,'if nums[mid] < target:'),undefined);
 assert.equal(conceptCue('binary-search-standard',f(v),undefined,{...data,nums:[7,6,5,4,3,2,1]},'if nums[mid] < target:'),undefined);
});
test('two pointers explains the direction and skips stale sums',()=>{
 const data={nums:[2,7,11,15],target:9};
 assert.match(conceptCue('two-sum-sorted',f({left:0,right:3,total:17}),undefined,data,'if total > target:').text,/too large/);
 assert.equal(conceptCue('two-sum-sorted',f({left:0,right:2,total:17}),undefined,data,'if total > target:'),undefined);
});

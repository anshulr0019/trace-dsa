import {test} from 'node:test';
import assert from 'node:assert/strict';
import {needsExecution,withExecutionBoundaries} from '../lib/curriculum/execution.ts';
import {restoreDraft,legacyStarter,playgroundSource} from '../lib/curriculum/playground.ts';
import {problemById} from '../lib/curriculum/catalog.ts';
test('unmodified obsolete starter drafts upgrade, while edited drafts survive',()=>{
 const p=problemById['set-mismatch'];
 for(const language of ['cpp','javascript']){
  const starter=legacyStarter(p,language),reference=playgroundSource(p,language);
  assert.equal(restoreDraft(p,language,starter,reference),reference);
  assert.equal(restoreDraft(p,language,starter+'\n// my edits',reference),starter+'\n// my edits');
 }
});
test('Play executes an unopened or edited solution instead of disabling playback',()=>{
 assert.equal(needsExecution(null,false),true);
 const r=withExecutionBoundaries({frames:[],result:3},{a:1,b:2});
 assert.equal(needsExecution(r,false),false);
 assert.equal(needsExecution(r,true),true);
});
test('zero-checkpoint and early-return executions have truthful playable boundaries',()=>{
 const r=withExecutionBoundaries({frames:[],result:[2,3]},{nums:[1,2,2,4]});
 assert.equal(r.frames.length,2);
 assert.deepEqual(r.frames[0].vars,{nums:[1,2,2,4]});
 assert.deepEqual(r.frames[1].vars.answer,[2,3]);
 assert.equal(r.frames[1].event,'complete');
});
test('single checkpoint is preserved between input and output, without fabricated code lines',()=>{
 const f={event:'checkpoint',line:7,function:'solve',stack:[],vars:{i:1}};
 const r=withExecutionBoundaries({frames:[f],result:true},{nums:[2,3]});
 assert.equal(r.frames.length,3);assert.deepEqual(r.frames[1],f);
 assert.equal(r.frames[0].line,0);assert.equal(r.frames[2].line,0);
 assert.equal(r.frames[2].vars.i,1);assert.equal(r.frames[2].vars.answer,true);
});
test('failed execution ends with an error state, never a successful completion',()=>{
 const r=withExecutionBoundaries({frames:[],result:null,error:'Syntax error'},{});
 assert.equal(r.frames.at(-1).event,'error');assert.equal(r.frames.at(-1).vars.error,'Syntax error');
});

import {test} from 'node:test';
import assert from 'node:assert/strict';
import {problems,problemById} from '../lib/curriculum/catalog.ts';
import {lessons,examplesFor,sameInput,matchesAnswer} from '../lib/curriculum/learning.ts';
import {validateProblemInput} from '../lib/curriculum/validate.ts';
import {pythonPrelude,pythonSources} from '../lib/curriculum/sources.ts';
import {playgroundSource} from '../lib/curriculum/playground.ts';
import {execute} from '../build/local-runtime.ts';

test('every problem has five distinct explained cases and authored teaching content',()=>{
 assert.equal(Object.keys(lessons).length,100);
 for(const p of problems){
  const lesson=lessons[p.id],examples=examplesFor(p);
  assert.ok(lesson.idea.length>40,p.id);assert.ok(lesson.steps.length>=3,p.id);
  assert.ok(lesson.why.length>60,p.id);assert.ok(lesson.cost.includes('O('),p.id);
  assert.equal(examples.length,5,p.id);
  assert.equal(new Set(examples.map(e=>JSON.stringify(e.input))).size,5,p.id);
  for(const e of examples){assert.equal(validateProblemInput(p.id,e.input),null,`${p.id} ${e.label}`);assert.ok(e.walkthrough.length>=1,`${p.id} ${e.label}`);}
 }
});
test('comparison recognizes equivalent inputs and valid alternate answers without accepting invalid ones',()=>{
 assert.ok(sameInput({k:2,nums:[1,2]},{nums:[1,2],k:2}));
 const course=problemById['course-order'];assert.ok(matchesAnswer(course,course.input,course.expected,[0,2,1,3]));assert.ok(!matchesAnswer(course,course.input,course.expected,[3,2,1,0]));
 const matrix=problemById['build-matrix'];assert.ok(matchesAnswer(matrix,matrix.input,matrix.expected,[[3,0,0],[0,0,1],[0,2,0]]));assert.ok(!matchesAnswer(matrix,matrix.input,matrix.expected,[[1,0,0],[0,2,0],[0,0,3]]));
 const alien=problemById['alien-dictionary'];assert.ok(matchesAnswer(alien,{words:['ab','ac']},'abc','bca'));assert.ok(!matchesAnswer(alien,{words:['ab','ac']},'abc','cba'));
 const subsets=problemById.subsets;assert.ok(matchesAnswer(subsets,subsets.input,subsets.expected,[[2],[2,1],[1],[]]));assert.ok(!matchesAnswer(subsets,subsets.input,subsets.expected,[[],[1],[2]]));
});
for(const language of (process.env.LEARNING_LANGUAGES??'python,javascript,cpp').split(','))for(const p of problems)for(const e of examplesFor(p).slice(1))test(`${language}: ${p.id} / ${e.label}`,async()=>{
 const code=language==='python'?pythonPrelude+pythonSources[p.id]:playgroundSource(p,language);
 const run=await execute({language,code,input:e.input,problemId:p.id});
 assert.equal(run.error,null);assert.ok(matchesAnswer(p,e.input,e.expected,run.result),`Expected ${JSON.stringify(e.expected)}; got ${JSON.stringify(run.result)}`);
 assert.ok(run.frames.length>=2);assert.equal(run.frames[0].event,'input');assert.equal(run.frames.at(-1).event,'complete');
});

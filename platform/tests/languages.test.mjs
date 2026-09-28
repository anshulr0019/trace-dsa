import {test} from 'node:test';
import assert from 'node:assert/strict';
import {problems,problemById} from '../lib/curriculum/catalog.ts';
import {playgroundSource,hasReference} from '../lib/curriculum/playground.ts';
import {pythonSources,pythonPrelude} from '../lib/curriculum/sources.ts';
import {execute} from '../build/local-runtime.ts';
import {validateProblemInput} from '../lib/curriculum/validate.ts';
const code=(p,l)=>l==='python'?pythonPrelude+pythonSources[p.id]:playgroundSource(p,l);
test('every problem has three complete references and valid default input',()=>{
 for(const p of problems){assert.equal(validateProblemInput(p.id,p.input),null,p.id);for(const l of ['python','cpp','javascript'])assert.ok(hasReference(p.id,l),`${p.id} ${l}`);}
});
for(const language of ['cpp','javascript'])for(const p of problems)test(`${language}: ${p.id}`,async()=>{
 const source=code(p,language),r=await execute({language,code:source,input:p.input,problemId:p.id});
 assert.equal(r.error,null);assert.deepEqual(r.result,p.expected);
 assert.ok(r.frames.length>=2,'every completed run must be playable');
 assert.equal(r.frames[0].event,'input');assert.equal(r.frames.at(-1).event,'complete');
 for(const f of r.frames.filter(f=>f.event==='checkpoint'))assert.ok(f.line>0&&f.line<=source.split('\n').length,`invalid source line ${f.line}`);
});
const edges=[
 ['maximum-average-subarray',{nums:[-5,-2,-8],k:1},-2],
 ['minimum-window',{s:'AAAB',t:'AAB'},'AAB'],
 ['minimum-window',{s:'abc',t:''},''],
 ['three-sum',{nums:[0,0,0,0]},[[0,0,0]]],
 ['trapping-rain',{height:[4,2,0,3,2,5]},9],
 ['cycle-entrance',{values:[1,2],pos:0},0],
 ['reverse-k-group',{values:[1,2,3,4,5],k:3},[3,2,1,4,5]],
 ['search-rotated-duplicates',{nums:[1,1,1,1,0,1],target:0},true],
 ['median-sorted-arrays',{nums1:[],nums2:[1,2]},1.5],
 ['maximum-path-sum',{tree:[-3,-2,-7]},-2],
 ['word-dictionary',{operations:[['addWord','bad'],['search','.ad'],['search','..'],['search','b..']]},[null,true,false,true]],
 ['rotting-oranges',{grid:[[2,0,1]]},-1],
 ['course-order',{numCourses:2,prerequisites:[[1,0],[0,1]]},[]],
 ['islands-ii',{m:2,n:2,positions:[[0,0],[0,0],[1,1],[0,1]]},[1,1,2,1]],
 ['cheapest-flights',{n:3,flights:[[0,1,1],[1,2,1],[0,2,9]],src:0,dst:2,k:0},9],
 ['median-stream',{nums:[-5,-1,0,10]},[-5,-3,-1,-.5]],
 ['decode-ways',{s:'100'},0],
 ['coin-change',{coins:[2],amount:3},-1],
 ['regex-matching',{s:'',p:'a*b*'},true],
 ['jump-game-ii',{nums:[0,1]},-1],
 ['sum-two-integers',{a:-5,b:3},-2],
 ['shortest-palindrome',{s:'abcd'},'dcbabcd'],
];
for(const [id,input,expected]of edges)test(`boundary agreement: ${id} ${JSON.stringify(input)}`,async()=>{
 for(const language of ['python','cpp','javascript']){const r=await execute({language,code:code(problemById[id],language),input,problemId:id});assert.equal(r.error,null,language);assert.deepEqual(r.result,expected,language);}
});
test('malformed custom input is rejected before execution',()=>{
 for(const [id,input]of [['maximum-average-subarray',{nums:[1],k:0}],['duplicate-number',{nums:[0,2]}],['islands-ii',{m:2,n:2,positions:[[2,0]]}],['network-delay',{n:2,k:1,times:[[1,3,1]]}],['combination-sum',{candidates:[0],target:1}],['regex-matching',{s:'x',p:'*x'}]])assert.ok(validateProblemInput(id,input),id);
});
test('JavaScript maps and sets are real checkpoint state',async()=>{
 const r=await execute({language:'javascript',code:'function solve(d){trace({seen:new Set([1,2]),counts:new Map([["a",2]])});return 1;}',input:{}});
 const checkpoint=r.frames.find(f=>f.event==='checkpoint');assert.deepEqual(checkpoint.vars,{seen:[1,2],counts:{a:2}});assert.equal(checkpoint.line,1);
});
test('Python returned results are not silently truncated like snapshot previews',async()=>{
 const r=await execute({language:'python',code:'def solve(d):\n    return list(range(150))',input:{}});assert.equal(r.result.length,150);
});

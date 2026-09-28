import {test} from 'node:test';
import assert from 'node:assert/strict';
import {execute} from '../build/local-runtime.ts';
import {problems} from '../lib/curriculum/catalog.ts';
import {playgroundSource} from '../lib/curriculum/playground.ts';
import {matchesAnswer} from '../lib/curriculum/learning.ts';
const cpp=body=>'#include "trace.hpp"\njson solve(json data) { '+body+' }';
for(const language of ['javascript','cpp'])for(const p of problems)test(`automatic ${language}: ${p.id}`,async()=>{
 const run=await execute({language,code:playgroundSource(p,language),input:p.input,problemId:p.id,automatic:true});
 assert.equal(run.error,null);assert.ok(matchesAnswer(p,p.input,p.expected,run.result),p.id);assert.ok(run.frames.some(f=>f.event==='line'));
});
for(const language of ['javascript','cpp']){
 test(`${language}: changed logic and renamed variables produce actual states`,async()=>{
  const code=language==='cpp'?cpp('vector<int> renamed=data["nums"]; int wrong=0; for(int cursor=0;cursor<renamed.size();cursor++) wrong-=renamed[cursor]; return wrong;'):'function solve(data){const renamed=data.nums;let wrong=0;for(let cursor=0;cursor<renamed.length;cursor++)wrong-=renamed[cursor];return wrong;}';
  const run=await execute({language,code,input:{nums:[1,2,3]},automatic:true});assert.equal(run.error,null);assert.equal(run.result,-6);assert.ok(run.frames.some(f=>f.vars.wrong===-3));assert.ok(run.frames.some(f=>f.vars.cursor===2));
 });
 test(`${language}: runtime failure preserves the preceding steps`,async()=>{
  const code=language==='cpp'?cpp('int reached=7; throw runtime_error("test failure"); return 0;'):'function solve(data){let reached=7;throw Error("test failure");}';
  const run=await execute({language,code,input:{},automatic:true});assert.match(run.error,/test failure/);assert.ok(run.frames.some(f=>f.vars.reached===7));assert.equal(run.frames.at(-1).event,'error');
 });
 test(`${language}: infinite loop retains a bounded trace`,async()=>{
  const code=language==='cpp'?cpp('int count=0; while(true){count++;} return count;'):'function solve(data){let count=0;while(true){count++;}}';
  const run=await execute({language,code,input:{},automatic:true});assert.ok(run.error);assert.ok(run.frames.length>5);assert.ok(run.frames.length<=1202);assert.equal(run.frames.at(-1).event,'error');
 });
 test(`${language}: syntax failure has no invented intermediate execution`,async()=>{
  const run=await execute({language,code:language==='cpp'?cpp('int x = ; return x;'):'function solve(data) { let x = ; }',input:{},automatic:true});assert.ok(run.error);assert.equal(run.frames.filter(f=>f.event==='line').length,0);assert.ok(run.frames.at(-1).line>0);
 });
}
test('C++ range loops and helper calls are traced',async()=>{const run=await execute({language:'cpp',code:'#include "trace.hpp"\nint twice(int x){int y=x*2; return y;}\njson solve(json data){int total=0;for(int x:vector<int>{1,2,3}){total+=twice(x);}return total;}',input:{},automatic:true});assert.equal(run.error,null);assert.equal(run.result,12);assert.ok(run.frames.some(f=>f.vars.y===4));});

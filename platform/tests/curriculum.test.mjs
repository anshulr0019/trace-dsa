import {test} from 'node:test';
import assert from 'node:assert/strict';
import {execute} from '../build/local-runtime.ts';
import {problems} from '../lib/curriculum/catalog.ts';
import {pythonLinear} from '../lib/curriculum/python-linear.ts';
import {pythonSearch} from '../lib/curriculum/python-search.ts';
import {pythonGraph} from '../lib/curriculum/python-graph.ts';
import {pythonAdvanced} from '../lib/curriculum/python-advanced.ts';
const sources={...pythonLinear,...pythonSearch,...pythonGraph,...pythonAdvanced};
const prelude='from collections import Counter, defaultdict, deque\nimport heapq\nfrom trace_support import tree, linked\n';
test('curriculum has exactly 100 unique problems and complete Python solutions',()=>{
 assert.equal(problems.length,100);assert.equal(new Set(problems.map(p=>p.id)).size,100);
 for(const p of problems)assert.ok(sources[p.id],p.id);
});
for(const p of problems)test(p.title,async()=>{
 const r=await execute({language:'python',code:prelude+sources[p.id],input:p.input});
 assert.equal(r.error,null,`${p.id}: ${r.error}`);assert.deepEqual(r.result,p.expected,p.id);assert.ok(r.frames.length>1);
});
test('edited Python and JavaScript produce their own results',async()=>{
 for(const language of ['python','javascript']){
  const code=language==='python'?'def solve(data):\n    x = data["x"] * 3\n    return x':'function solve(data) { const x = data.x * 3; trace({x},1); return x; }';
  const r=await execute({language,code,input:{x:7}});assert.equal(r.error,null);assert.equal(r.result,21);assert.ok(r.frames.length);
 }
});
test('sandbox rejects reading project files',async()=>{
 const r=await execute({language:'python',code:`def solve(data):\n    return open(${JSON.stringify(process.cwd()+'/package.json')}).read()`,input:{}});
 assert.match(r.error,/PermissionError/);
});
test('syntax errors are reported',async()=>{
 const r=await execute({language:'python',code:'def solve(data)\n    return 1',input:{}});assert.match(r.error,/SyntaxError/);
});
test('compiled C++ runs edited code and emits its own checkpoints',async()=>{
 const r=await execute({language:'cpp',code:'#include "trace.hpp"\njson solve(json data) { int result = data["x"].get<int>() * 4; TRACE({{"result",result}}); return result; }',input:{x:7}});
 assert.equal(r.error,null);assert.equal(r.result,28);assert.equal(r.frames.find(f=>f.event==='checkpoint').vars.result,28);
});

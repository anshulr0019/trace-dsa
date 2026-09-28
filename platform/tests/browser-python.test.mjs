import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { loadPyodide } from 'pyodide';
import { problems } from '../lib/curriculum/catalog.ts';
import { pythonPrelude, pythonSources } from '../lib/curriculum/sources.ts';
const py = await loadPyodide({indexURL:fileURLToPath(new URL('../node_modules/pyodide/',import.meta.url))});
py.FS.writeFile('/home/pyodide/trace_support.py',readFileSync(new URL('../runtime/trace_support.py',import.meta.url),'utf8'));
const runner=readFileSync(new URL('../runtime/python_runner.py',import.meta.url),'utf8');
function run(code,input){
 const globals=py.toPy({__trace_payload:JSON.stringify({code,input})});
 try{return JSON.parse(py.runPython(runner+'\nencoded_run',{globals}));}finally{globals.destroy();}
}
for(const p of problems)test(`browser Python: ${p.title}`,()=>{
 const result=run(pythonPrelude+pythonSources[p.id],p.input);
 assert.equal(result.error,null);
 assert.deepEqual(result.result,p.expected);
 assert.ok(result.frames.some(f=>f.event==='line'));
});
test('browser Python executes edited code, captures variables and stdout',()=>{
 const r=run('def solve(data):\n    total=sum(data["nums"]) * 3\n    print(total)\n    return total',{nums:[2,5]});
 assert.equal(r.result,21);assert.equal(r.stdout,'21\n');
 assert.ok(r.frames.some(f=>f.vars.total===21));
});
test('browser Python preserves error source lines and bounds loops',()=>{
 const syntax=run('def solve(data)\n    return 1',{});
 assert.match(syntax.error,/SyntaxError/);assert.equal(syntax.errorLine,1);
 const loop=run('def solve(data):\n    while True:\n        x = 1',{});
 assert.match(loop.error,/30,000/);assert.equal(loop.frames.length,1200);assert.equal(loop.truncated,true);
});

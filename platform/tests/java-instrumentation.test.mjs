import {test} from 'node:test';
import assert from 'node:assert/strict';
import {instrumentJava} from '../lib/curriculum/instrument-java.ts';
test('Java checkpoints keep source lines and leave literals intact',()=>{
 const code='class Solution {\n void f(){\n String s="trace(hello)"; // trace(fake)\n trace("s",s);\n Trace.trace("s",s);\n }\n}';
 const result=instrumentJava(code);
 assert.ok(result.includes('traceAt(4,"s",s)'));
 assert.ok(result.includes('Trace.traceAt(5,"s",s)'));
 assert.ok(result.includes('"trace(hello)"; // trace(fake)'));
 assert.equal(result.split('\n').length,code.split('\n').length);
});
test('unrelated trace methods and declarations are not rewritten',()=>{
 const code='class Other { void trace(int n) {} void f(){ other.trace(2); } }';
 assert.equal(instrumentJava(code),code);
});

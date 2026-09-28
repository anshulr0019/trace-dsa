import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {problems} from '../lib/curriculum/catalog.ts';
import {examplesFor,matchesAnswer} from '../lib/curriculum/learning.ts';
import {instrumentJava} from '../lib/curriculum/instrument-java.ts';
import sources from '../lib/curriculum/java-sources.json' with {type:'json'};
const java=process.env.TRACE_JAVA || 'java';
const root=await mkdtemp(join(tmpdir(),'trace-java-test-'));
let failed=0,passed=0;
try{for(const p of problems){
 const source=join(root,'Solution.java'),input=join(root,'input.json');await writeFile(source,instrumentJava(sources[p.id]));
 for(const [index,example] of examplesFor(p).entries()){
  await writeFile(input,JSON.stringify(example.input));const out=join(root,p.id+'-'+index);
  try{execFileSync(java,['-cp',resolve('runtime/vendor/java/trace-runtime.jar'),'TraceRunner',source,input,out],{timeout:20000,stdio:'pipe'});
   const run=JSON.parse(await readFile(join(out,'result.json'),'utf8'));
   if(run.error||!matchesAnswer(p,example.input,example.expected,run.result))throw Error(run.error||`expected ${JSON.stringify(example.expected)} got ${JSON.stringify(run.result)}`);
   for(const frame of run.frames)if(frame.line<1||frame.line>sources[p.id].split('\n').length)throw Error('invalid checkpoint line');passed++;
  }catch(e){console.log('FAIL',p.id,index,String(e));failed++;break;}
 }
 if((passed+failed)%50===0)console.log('Progress',passed,'passed',failed,'failed');
}console.log({passed,failed});}finally{await rm(root,{recursive:true,force:true});}
if(failed)process.exitCode=1;

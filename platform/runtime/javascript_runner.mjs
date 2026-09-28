import fs from 'node:fs';
import vm from 'node:vm';
const payload = JSON.parse(fs.readFileSync(0, 'utf8'));
const frames = [];
let stdout = '', truncated = false, result = null, error = null;
let steps = 0, errorLine = 0;
const clean = value => JSON.parse(JSON.stringify(value, (_, v) => Object.prototype.toString.call(v)==='[object Set]' ? [...v] : Object.prototype.toString.call(v)==='[object Map]' ? Object.fromEntries(v) : typeof v === 'bigint' ? v.toString() : typeof v === 'number'&&!Number.isFinite(v)?String(v):v));
const trace = (vars, line = 0, metadata = {}) => {
  if(++steps>30000)throw Error('Execution stopped after 30,000 steps; inspect the loop condition.');
  if (frames.length >= 1200) { truncated = true; return; }
  if(!line) line=Number(new Error().stack?.match(/solution\.js:(\d+):\d+/)?.[1]??0);
  frames.push({line, event:'checkpoint', function:'solve', stack:[], vars:clean(vars),...metadata});
  fs.appendFileSync('frames.jsonl',JSON.stringify(frames.at(-1))+'\n');
};
const autoTrace=(line,getters,functionName='solve')=>{
 const vars={};for(const [name,get] of Object.entries(getters)){try{const value=get();if(typeof value!=='function'&&value!==undefined){try{vars[name]=clean(value);}catch{vars[name]='<cyclic or unsupported object>';}}}catch{/* not initialized in this scope yet */}}
 const stack=[...new Error().stack.matchAll(/at (.*?) \(solution\.js:(\d+):\d+\)/g)].slice(0,30).map(m=>({name:m[1],line:Number(m[2])})).reverse();
 trace(vars,line,{event:'line',function:functionName,stack});
};
try {
  // OS Seatbelt is the security boundary. The VM only isolates lesson globals.
  const context = vm.createContext({input:payload.input, trace,__traceAuto:autoTrace, console:{log:(...args)=>{stdout = (stdout + args.map(String).join(' ') + '\n').slice(0,16000);}}});
  result = new vm.Script(payload.code + '\n;solve(input);', {filename:'solution.js'}).runInContext(context, {timeout:4000});
  result = clean(result ?? null);
  if(JSON.stringify(result).length>1000000)throw Error('Returned answer exceeds 1 MB; use a smaller input.');
} catch (e) { error = String(e);errorLine=Number(e.stack?.match(/solution\.js:(\d+)/)?.[1]??0); }
process.stdout.write(JSON.stringify({result, frames, stdout, error, errorLine, truncated}));

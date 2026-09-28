import type { Plugin } from "vite";
import { spawn } from "node:child_process";
import { mkdtemp, realpath, writeFile, copyFile, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {validateProblemInput} from "../lib/curriculum/validate";
import {withExecutionBoundaries} from "../lib/curriculum/execution";
import {instrumentJavascript,instrumentCpp} from './instrument';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../runtime");
const python = "/opt/homebrew/bin/python3";
const quote = (s:string) => JSON.stringify(s);

export function profile(dir:string, compile=false) {
  const roots = [dir,"/System","/usr/lib","/usr/share","/private/var/db/dyld","/Library/Apple","/Library/Developer/CommandLineTools","/opt/homebrew/Cellar/python@3.14","/opt/homebrew/opt/python@3.14",path.dirname(process.execPath)];
  return `(version 1)(deny default)(allow process-exec)(allow sysctl-read)(allow mach-lookup)
  (allow file-read* (literal "/") (literal "/opt") (literal "/opt/homebrew") (literal "/opt/homebrew/Cellar") (literal "/opt/homebrew/opt") (literal "/usr") (literal "/bin") (literal "/private") (literal "/private/var") (literal "/Library"))
  (allow file-read-metadata)(allow file-read* (literal "/dev/urandom") (literal "/dev/null") (literal "/usr/bin/clang++") (literal "/opt/homebrew/bin/python3") ${roots.map(p=>`(subpath ${quote(p)})`).join(" ")})
  (allow file-write* (subpath ${quote(dir)}) (literal "/dev/null"))${compile ? "(allow process-fork)" : ""}`;
}

async function child(command:string, args:string[], input:string, dir:string, compile=false, signal?:AbortSignal):Promise<string> {
  signal?.throwIfAborted();
  return new Promise((resolve,reject)=>{
    const proc = spawn("/usr/bin/sandbox-exec",["-p",profile(dir,compile),command,...args],{cwd:dir,detached:true,env:{NODE_ENV:"production",PATH:"/usr/bin:/bin",HOME:dir,TMPDIR:dir,PYTHONDONTWRITEBYTECODE:"1",PYTHONUNBUFFERED:"1",PYTHONHASHSEED:"0"},stdio:["pipe","pipe","pipe"]});
    let stdout="", stderr="", size=0, failure="";
    const stop=()=>{ try { process.kill(-proc.pid!,"SIGKILL"); } catch {} };
    const abort=()=>{failure="Run cancelled.";stop();};
    signal?.addEventListener('abort',abort,{once:true});
    const timer=setTimeout(()=>{failure=compile?"Compilation timed out (25 seconds).":"Execution timed out (6 seconds).";stop();},compile?25000:6000);
    proc.stdout.on("data",chunk=>{size+=chunk.length;if(size>8_000_000){failure="Output exceeded 8 MB.";stop();}else stdout+=chunk;});
    proc.stderr.on("data",chunk=>{size+=chunk.length;if(size>8_000_000){failure="Output exceeded 8 MB.";stop();}else stderr+=chunk;});
    proc.on("error",err=>{clearTimeout(timer);signal?.removeEventListener('abort',abort);reject(err);});
    proc.on("close",(code,exitSignal)=>{clearTimeout(timer);signal?.removeEventListener('abort',abort);stop();if(failure||code!==0)reject(new Error(failure||stderr.slice(0,4000)||`Runtime exited (${exitSignal??code}).`));else resolve(stdout);});
    proc.stdin.on("error",()=>{});
    proc.stdin.end(input);
  });
}
type Payload={language:string;code:string;input:unknown;problemId?:string;automatic?:boolean};
export async function execute(payload:Payload, signal?:AbortSignal) {
  signal?.throwIfAborted();
  const run=await executeRaw(payload,signal);
  signal?.throwIfAborted();
  return withExecutionBoundaries(run,payload.input as Record<string,unknown>);
}
async function executeRaw(payload:Payload,signal?:AbortSignal) {
  if(payload.problemId){const error=validateProblemInput(payload.problemId,payload.input);if(error)throw new Error(error);}
  if(process.platform!=="darwin") throw new Error("This local runner requires macOS Seatbelt. Execution is unavailable on this host.");
  const dir=await realpath(await mkdtemp(path.join(tmpdir(),"trace-run-")));
  try {
    if(payload.language==="python") {
      await Promise.all(["python_runner.py","trace_support.py"].map(f=>copyFile(path.join(root,f),path.join(dir,f))));
      return JSON.parse(await child(python,["-B",path.join(dir,"python_runner.py")],JSON.stringify(payload),dir,false,signal));
    }
    if(payload.language==="javascript") {
      if(payload.automatic)payload={...payload,code:instrumentJavascript(payload.code)};
      await copyFile(path.join(root,"javascript_runner.mjs"),path.join(dir,"runner.mjs"));
      return JSON.parse(await child(process.execPath,["--max-old-space-size=128",path.join(dir,"runner.mjs")],JSON.stringify(payload),dir,false,signal));
    }
    if(payload.language==="cpp") {
      await Promise.all([copyFile(path.join(root,"vendor/json.hpp"),path.join(dir,"json.hpp")),copyFile(path.join(root,"trace.hpp"),path.join(dir,"trace.hpp"))]);
      const main = `\nint main(){json input;cin>>input;ostringstream captured;auto* original=cout.rdbuf(captured.rdbuf());json result=nullptr;string error;try{result=solve(input);}catch(const exception& e){error=e.what();}cout.rdbuf(original);cout<<json({{"result",result},{"frames",trace_frames},{"stdout",captured.str().substr(0,16000)},{"error",error.empty()?json(nullptr):json(error)},{"truncated",trace_truncated}}).dump();}`;
      await writeFile(path.join(dir,"solution.cpp"),(payload.automatic?instrumentCpp(payload.code):payload.code)+main);
      await child("/Library/Developer/CommandLineTools/usr/bin/clang++",["-std=c++17","-O0","-isysroot","/Library/Developer/CommandLineTools/SDKs/MacOSX.sdk","-I",dir,path.join(dir,"solution.cpp"),"-o",path.join(dir,"solution")],"",dir,true,signal);
      return JSON.parse(await child(path.join(dir,"solution"),[],JSON.stringify(payload.input),dir,false,signal));
    }
    throw new Error("Choose Python, C++ or JavaScript. Other runtimes are not installed.");
  } catch(error) {
    let frames=[];try{frames=(await readFile(path.join(dir,'frames.jsonl'),'utf8')).trim().split('\n').filter(Boolean).flatMap(line=>{try{return [JSON.parse(line)];}catch{return [];}});}catch{}
    const message=error instanceof Error?error.message:String(error);
    const errorLine=Number(message.match(/solution\.(?:cpp|js):(\d+)/)?.[1]??(error as {loc?:{line?:number}})?.loc?.line??frames.at(-1)?.line??0);
    return {frames,result:null,error:message,errorLine,stdout:'',truncated:frames.length>=1200};
  } finally { await rm(dir,{recursive:true,force:true}); }
}

export function localRuntime():Plugin {
  let active=0;
  return {name:"trace-local-runtime", configureServer(server) {
    server.middlewares.use("/api/local-runtime",async(req,res,next)=>{
      const reply=(status:number,value:unknown)=>{res.statusCode=status;res.setHeader("Content-Type","application/json");res.setHeader("Cache-Control","no-store");res.end(JSON.stringify(value));};
      const host=req.headers.host??"", remote=req.socket.remoteAddress;
      if(!/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)||!["127.0.0.1","::1","::ffff:127.0.0.1"].includes(remote??"")) return reply(403,{error:"Local access only."});
      if(req.method==="GET") return reply(200,{languages:["python","cpp","javascript"],local:true});
      if(req.method!=="POST") return reply(405,{error:"POST required."});
      if(req.headers.origin!==`http://${host}` || req.headers["content-type"]!=="application/json") return reply(403,{error:"Same-origin JSON requests required."});
      if(active>=2)return reply(429,{error:"Two runs are already active. Try again shortly."});
      active++;
      const controller=new AbortController();
      const cancel=()=>{if(!res.writableEnded)controller.abort();};
      res.on('close',cancel);
      try {
        let body="";
        for await(const chunk of req){body+=chunk;if(body.length>100_000)throw new Error("Code and input must be under 100 KB.");}
        const payload=JSON.parse(body);
        if(typeof payload.code!=="string"||typeof payload.language!=="string"||payload.input===undefined)throw new Error("Code, language and input are required.");
        reply(200,await execute(payload,controller.signal));
      }catch(err){reply(400,{error:err instanceof Error?err.message:String(err)});}
      finally{active--;res.removeListener('close',cancel);}
    });
  }};
}

"use client";
import {useEffect,useRef,useState} from "react";
import {ArrowLeft,ArrowRight,Check,Code2,Play,Pause,RotateCcw,Search,SkipBack,SkipForward,Terminal} from "lucide-react";
import {problems,patterns,tiers,problemById,type Problem} from "@/lib/curriculum/catalog";
import {pythonSources,pythonPrelude} from "@/lib/curriculum/sources";
import {playgroundSource,hasReference,restoreDraft,type Language} from "@/lib/curriculum/playground";
import {validateProblemInput} from "@/lib/curriculum/validate";
import {executeSubmission,runtimeCapabilities,type RuntimeCapabilities} from "@/lib/curriculum/runtime-client";
import {needsExecution} from "@/lib/curriculum/execution";
import {examplesFor,sameInput,matchesAnswer,lessons} from "@/lib/curriculum/learning";
import {ExampleShelf,ExecutionInspector} from "./execution-inspector";
import {LearningGuide} from "./learning-guide";
import {Editor} from "./editor";
import {Scene,display,type ExecutionFrame} from "./scene";
import {PracticeLab} from "../practice/practice-lab";
import {useFramePlayback} from "./use-frame-playback";
import "./curriculum.css";
import "./workspace.css";
type Run={frames:ExecutionFrame[];result:unknown;error?:string|null;stdout?:string;truncated?:boolean};
const formatInput=(data:Record<string,unknown>)=>"{\n"+Object.entries(data).map(([key,value])=>`  ${JSON.stringify(key)}: ${JSON.stringify(value)}`).join(",\n")+"\n}";
const sourceFor=(p:Problem,l:Language)=>l==="python"?pythonPrelude+pythonSources[p.id]:playgroundSource(p,l);
const languages:{id:Language;label:string;file:string}[]=[{id:"python",label:"Python 3",file:"solution.py"},{id:"cpp",label:"C++17",file:"solution.cpp"},{id:"javascript",label:"JavaScript",file:"solution.js"}];
function ProblemStudio({problem:p,onBack,onProblem,onExisting}:{problem:Problem;onBack:()=>void;onProblem:(id:string)=>void;onExisting:(id:string)=>void}){
 const [language,setLanguage]=useState<Language>("python"),[code,setCode]=useState(sourceFor(p,"python")),[input,setInput]=useState(formatInput(p.input));
 const [result,setResult]=useState<Run|null>(null),[speed,setSpeed]=useState(1),[running,setRunning]=useState(false),[error,setError]=useState("");
 const {step,setStep,playing,setPlaying}=useFramePlayback(result?.frames.length??0,speed);
 const [experience,setExperience]=useState<'learn'|'practice'>('learn');
 const [snapshot,setSnapshot]=useState({code:"",input:"",language:"python"}),[runInput,setRunInput]=useState(p.input),[runtime,setRuntime]=useState<RuntimeCapabilities|null>(null);
 const [panel,setPanel]=useState("input"),[ready,setReady]=useState(false),[complete,setComplete]=useState(false);
 function switchExperience(next:'learn'|'practice'){setPlaying(false);setExperience(next);const url=new URL(location.href);if(next==='practice')url.searchParams.set('practice','1');else url.searchParams.delete('practice');window.history.replaceState(null,'',url.pathname+url.search);}
 const examples=examplesFor(p);
 const [customMode,setCustomMode]=useState(false);
 const [mode,setMode]=useState<'guided'|'mine'>('mine'),[batch,setBatch]=useState<string[]>([]),[visualVariable,setVisualVariable]=useState(''),[visualKind,setVisualKind]=useState('array'),[markerVariable,setMarkerVariable]=useState('');
 const activeCode=mode==='guided'?sourceFor(p,language):code;
 let selectedExample=-1;try{selectedExample=customMode?-1:examples.findIndex(e=>sameInput(e.input,JSON.parse(input)));}catch{}
 function chooseExample(index:number){setPlaying(false);setResult(null);setStep(0);setError('');setPanel('input');setCustomMode(index<0);if(index>=0)setInput(formatInput(examples[index].input));else{document.getElementById('problem-input')?.focus();}}
 const drafts=useRef<Record<string,string>>({}),request=useRef(0),inFlight=useRef(false),controller=useRef<AbortController|null>(null);
 useEffect(()=>{
  try{const preferred=localStorage.getItem("trace:language");if(languages.some(l=>l.id===preferred)){setLanguage(preferred as Language);setCode(sourceFor(p,preferred as Language));}const saved=JSON.parse(localStorage.getItem(`trace:problem:${p.id}`)??"null");if(saved){drafts.current=saved.drafts??{};const lang:Language=languages.some(l=>l.id===saved.language)?saved.language:"python";setLanguage(lang);setCode(restoreDraft(p,lang,drafts.current[lang],sourceFor(p,lang)));setInput(saved.input??formatInput(p.input));}setComplete(JSON.parse(localStorage.getItem("trace:curriculum:complete")??"[]").includes(p.id));}catch{}
  const requested=new URLSearchParams(location.search).get("language");if(languages.some(l=>l.id===requested)){const lang=requested as Language;setLanguage(lang);setCode(restoreDraft(p,lang,drafts.current[lang],sourceFor(p,lang)));}
  setExperience(new URLSearchParams(location.search).get("practice")==="1"?"practice":"learn");
  setReady(true);
  const statusController=new AbortController();
  void runtimeCapabilities(statusController.signal).then(setRuntime).catch(()=>{});
  return()=>{statusController.abort();request.current++;controller.current?.abort();};
 },[p]);
 useEffect(()=>{if(!ready)return;drafts.current[language]=code;try{localStorage.setItem(`trace:problem:${p.id}`,JSON.stringify({drafts:drafts.current,language,input}));}catch{}},[code,input,language,p.id,ready]);
 const stale=!!result&&(snapshot.code!==activeCode||snapshot.input!==input||snapshot.language!==language);
 const frame=result?.frames[step],prev=step?result?.frames[step-1]:undefined;
 async function run(autoplay=false,exampleInput?:string){
  if(inFlight.current||!runtime||!runtime.languages.includes(language))return;let data:Record<string,unknown>;
  const executingInput=exampleInput??input;
  try{data=JSON.parse(executingInput);if(!data||Array.isArray(data)||typeof data!=="object")throw Error("Input must be a JSON object.");}catch(e){setError(e instanceof Error?e.message:String(e));setPanel("input");return;}
  const inputError=validateProblemInput(p.id,data);if(inputError){setError(inputError);setPanel("input");return;}
  const id=++request.current;inFlight.current=true;controller.current=new AbortController();setRunning(true);setPlaying(false);setError("");setResult(null);setStep(0);
  try{
   const value=await executeSubmission({language,code:activeCode,input:data,problemId:p.id,automatic:mode==="mine"},runtime,controller.current.signal);if(id!==request.current)return;
   setResult(value);setSnapshot({code:activeCode,input:executingInput,language});setRunInput(data);setPanel("output");setPlaying(autoplay&&value.frames.length>1);
  }catch(e){if(id===request.current)setError(e instanceof Error?e.message:String(e));}
  finally{if(id===request.current){inFlight.current=false;setRunning(false);}}
 }
 function togglePlayback(){if(playing){setPlaying(false);return;}if(needsExecution(result,stale)){void run(true);return;}if(step===(result?.frames.length??0)-1)setStep(0);setPlaying(true);}
 function changeLanguage(next:Language){try{localStorage.setItem("trace:language",next);}catch{}drafts.current[language]=code;setLanguage(next);setCode(restoreDraft(p,next,drafts.current[next],sourceFor(p,next)));setPlaying(false);setResult(null);setBatch([]);const url=new URL(location.href);url.searchParams.set("language",next);window.history.replaceState(null,"",url.pathname+url.search);}
 function mark(){let list:string[]=[];try{list=JSON.parse(localStorage.getItem("trace:curriculum:complete")??"[]");}catch{}list=complete?list.filter(id=>id!==p.id):[...new Set([...list,p.id])];try{localStorage.setItem("trace:curriculum:complete",JSON.stringify(list));}catch{}setComplete(!complete);}
 async function runExamples(){
  if(inFlight.current||!runtime||!runtime.languages.includes(language))return;inFlight.current=true;setRunning(true);setPlaying(false);setError('');setBatch([]);const id=++request.current;controller.current=new AbortController();
  try{for(let i=0;i<examples.length;i++){setBatch(b=>{const n=[...b];n[i]='Running';return n;});let status='Error';try{const value=await executeSubmission({language,code:activeCode,input:examples[i].input,problemId:p.id,automatic:mode==='mine'},runtime,controller.current.signal);if(id!==request.current)return;status=value.error?'Error':matchesAnswer(p,examples[i].input,examples[i].expected,value.result)?'Passed':'Failed';}catch(e){if(controller.current.signal.aborted)return;status='Error';}setBatch(b=>{const n=[...b];n[i]=status;return n;});}}
  finally{if(id===request.current){inFlight.current=false;setRunning(false);}}
 }
 function stop(){request.current++;controller.current?.abort();inFlight.current=false;setRunning(false);setPlaying(false);setBatch(b=>b.map(x=>x==='Running'?'Cancelled':x));setError('Run cancelled. The isolated worker has been asked to stop.');}
 const canRun=!!runtime?.languages.includes(language);
 const sample=result&&examplesFor(p).find(example=>sameInput(runInput,example.input));
 const match=sample&&result&&matchesAnswer(p,runInput,sample.expected,result.result);
 let preview=p.input;try{const parsed=JSON.parse(input);if(parsed&&typeof parsed==="object"&&!Array.isArray(parsed))preview=parsed;}catch{}
 return <section className="curriculum problem-studio">
  <div className="problem-navigation"><button className="text-action" onClick={onBack}><ArrowLeft size={14}/> All 100 problems</button><span className="runtime-status">{!runtime?"Checking runtime…":runtime.server?"Connected runtime":canRun?"Runs in your browser":"C++ compiler required"}</span></div>
  <div className="curriculum-heading"><div><div className="eyebrow mint">TIER {p.tier} / {patterns[p.group-1]} / {p.stage}</div><h1>{p.title}</h1><p>{p.goal}</p></div><button className={`complete-button ${complete?"is-complete":""}`} onClick={mark}><Check size={16}/>{complete?"Understood":"Mark understood"}</button></div>
  <div className="studio-controls"><div className="learning-mode-switch" role="group" aria-label="Learning mode"><button aria-pressed={experience==='learn'} onClick={()=>switchExperience('learn')}>Learn & explore</button><button aria-pressed={experience==='practice'} disabled={running} onClick={()=>{switchExperience('practice');}}>Practice & improve</button></div>{experience==='learn'&&<div className="studio-run-toolbar"><div role="group" aria-label="Code source"><button disabled={running} aria-pressed={mode==='mine'} onClick={()=>{setMode('mine');setPlaying(false);setResult(null);setBatch([]);}}>My code</button><button disabled={running} aria-pressed={mode==='guided'} onClick={()=>{setMode('guided');setPlaying(false);setResult(null);setBatch([]);}}>Guided solution</button></div><button disabled={running||!ready||!runtime?.languages.includes(language)} onClick={()=>void runExamples()}>Check all 5 examples</button>{running&&<button onClick={stop}>Cancel run</button>}<span>{mode==='mine'?'Your actual execution · automatic tracing':'Reference code · guided checkpoints'}</span></div>}</div>
  {experience==='practice'?<PracticeLab problem={p} language={language} onLanguage={changeLanguage} onProblem={onProblem}/>:<>

  <ExampleShelf examples={examples} selected={selectedExample} onSelect={chooseExample} disabled={running} batch={batch}/>
  <p className="example-run-hint">{selectedExample>=0?`Example ${selectedExample+1}: ${examples[selectedExample].label}`:'Custom input'} · Edit the input or run the solution to inspect each step.</p>
  <div className="curriculum-workbench" id="visual-workbench">
   <section className="trace-visual-panel" aria-label="Visual execution"><header><span>01 / VISUAL EXECUTION</span><span>{result?`${result.frames.length} captured states`:"Input preview"}</span></header><div className="trace-visual-body">
    {stale&&<div className="trace-notice">Code or input changed. Press Play to run and visualize the current version.</div>}
    {running&&<div className="trace-notice" role="status">{language==="cpp"?"Compiling C++…":runtime?.server?"Preparing playback…":language==="python"?"Loading Python & running… First run may take a moment.":"Running JavaScript…"}</div>}
    {error&&<pre className="runtime-error" role="alert">{error}</pre>}
    {result?.error&&<pre className="runtime-error" role="alert">{result.error}</pre>}
    <div className="visual-binding"><label>Visualize variable<select aria-label="Visualize variable" value={visualVariable} onChange={e=>setVisualVariable(e.target.value)}><option value="">Automatic</option>{Object.entries(frame?.vars??preview).filter(([,v])=>Array.isArray(v)||typeof v==='string').map(([k])=><option key={k}>{k}</option>)}</select></label>{visualVariable&&<><label>As<select aria-label="Visualization type" value={visualKind} onChange={e=>setVisualKind(e.target.value)}>{['array','string','grid','stack','heap','tree','linked'].map(k=><option key={k}>{k}</option>)}</select></label><label>Marker<select aria-label="Marker variable" value={markerVariable} onChange={e=>setMarkerVariable(e.target.value)}><option value="">None</option>{Object.entries(frame?.vars??{}).filter(([,v])=>Number.isInteger(v)).map(([k])=><option key={k}>{k}</option>)}</select></label></>}</div>
    <Scene problem={p} speed={speed} input={result?runInput:preview} language={result?snapshot.language:language} frame={frame} previous={prev} binding={visualVariable?{name:visualVariable,kind:visualKind,marker:markerVariable}:undefined}/>
    </div>
    <ExecutionInspector frame={frame} previous={prev} code={snapshot.code}/>
    <div className="scalar-state">{Object.entries(frame?.vars??{}).filter(([k,v])=>k!=="data"&&(v===null||["number","boolean","string"].includes(typeof v))).map(([key,value])=><div key={key} className={prev&&display(prev.vars[key])!==display(value)?"changed":""}><label>{key}</label><strong className="step-transition" key={display(value)}>{display(value)}</strong></div>)}</div>
    <div className="curriculum-playback"><div><button aria-label="First frame" disabled={!result?.frames.length} onClick={()=>{setPlaying(false);setStep(0);}}><SkipBack size={16}/></button><button aria-label="Previous frame" disabled={!step} onClick={()=>{setPlaying(false);setStep(s=>Math.max(0,s-1));}}><ArrowLeft size={16}/></button><button className="play" aria-label={playing?"Pause trace":"Play trace"} disabled={running||!ready||!runtime?.languages.includes(language)} onClick={togglePlayback}>{playing?<Pause size={16}/>:<Play size={16}/>}</button><button aria-label="Next frame" disabled={!result||step>=result.frames.length-1} onClick={()=>{setPlaying(false);setStep(s=>s+1);}}><ArrowRight size={16}/></button><button aria-label="Last frame" disabled={!result?.frames.length} onClick={()=>{setPlaying(false);setStep(result!.frames.length-1);}}><SkipForward size={16}/></button><span>{result?.frames.length?step+1:0} / {result?.frames.length??0}</span><select aria-label="Playback speed" value={speed} onChange={e=>setSpeed(Number(e.target.value))}>{[.5,1,2,4].map(v=><option key={v} value={v}>{v}×</option>)}</select></div><input aria-label="Trace position" type="range" min={0} max={Math.max(0,(result?.frames.length??1)-1)} value={step} disabled={!result?.frames.length} onChange={e=>{setPlaying(false);setStep(Number(e.target.value));}}/></div>

   </section>
   <section className="trace-code-panel"><header><span><Code2 size={15}/> {languages.find(l=>l.id===language)?.file}</span><select aria-label="Programming language" value={language} disabled={running} onChange={e=>changeLanguage(e.target.value as Language)}>{languages.map(l=><option key={l.id} value={l.id}>{l.label}</option>)}</select></header>
    {!hasReference(p.id,language)&&<div className="trace-notice">Write your {language==="cpp"?"C++":"JavaScript"} solution here. The complete guided reference for this problem is available in Python.</div>}
    <div className="editor-actions"><button disabled={running||mode==='guided'} className="text-action" onClick={()=>{setCode(sourceFor(p,language));setPlaying(false);setBatch([]);}}><RotateCcw size={13}/> Reset code</button><span>⌘ / Ctrl + Enter</span><button className="run-code" disabled={running||!runtime?.languages.includes(language)} onClick={()=>void run(true)}><Play size={13}/>{running?language==="cpp"?"Compiling & running…":"Running…":"Run & visualize"}</button></div>
    <Editor language={language} value={activeCode} readOnly={mode==='guided'||running} onChange={(value)=>{setCode(value);setPlaying(false);setBatch([]);}} line={!stale?frame?.line??0:0} onRun={()=>void run(true)}/>
    <div className="console-tabs" role="tablist" aria-label="Code console">{["input","output","help"].map(tab=><button key={tab} role="tab" aria-selected={panel===tab} onClick={()=>setPanel(tab)}>{tab==="input"?"Input JSON":tab==="output"?"Output & errors":"Runtime guide"}</button>)}</div>
    {panel==="input"?<div className="input-panel"><label htmlFor="problem-input">Edit the values passed to solve(data).</label><textarea id="problem-input" disabled={running} value={input} onChange={e=>{setInput(e.target.value);setCustomMode(true);setPlaying(false);setResult(null);setStep(0);}} spellCheck={false}/><button className="text-action" disabled={running} onClick={()=>chooseExample(0)}>Restore example input</button></div>:panel==="output"?<div className="output-panel" aria-live="polite">{result?<><div className="output-status"><Terminal size={14}/>{result.error?"Runtime error":sample?match?"Example passed":"Different from example answer":"Executed · custom answer not verified"}</div>{result.error?<pre className="runtime-error">{result.error}</pre>:<pre>{JSON.stringify(result.result,null,2)}</pre>}{sample&&!match&&!result.error&&<p>Expected: <code>{display(sample.expected)}</code></p>}{result.stdout&&<><label>Standard output</label><pre>{result.stdout}</pre></>}{result.truncated&&<p className="trace-notice">Trace limited to the first 1,200 states. The result is from the completed execution.</p>}{!result.frames.some(f=>f.event==="checkpoint"||f.event==="line")&&<p>This run captured input and output only. Add trace checkpoints to inspect intermediate variables.</p>}</>:<p>Run your code to see the returned result and compiler or runtime errors.</p>}</div>:<div className="runtime-guide"><p><strong>Python 3</strong> — complete solutions for all 100 problems. Standard Python with automatic line tracing. tree() and linked() return values and index-based links.</p><p><strong>C++17</strong> — compiled locally with Clang. Define <code>json solve(json data)</code>; main() is provided. Use <code>TRACE({`{{"nums",nums},{"i",i}}`});</code> to add custom state. My code mode also captures supported local variables automatically. Pointer and custom types may require explicit serializable checkpoints. trace.hpp includes the STL and nlohmann JSON.</p><p><strong>JavaScript</strong> — define <code>solve(data)</code> and return JSON. Use <code>trace({`{nums, i}`})</code> for visual checkpoints. My code mode automatically captures ordinary statements and local values. Explicit trace calls remain available for additional detail.</p><p>All 100 problems include complete, editable Python, C++ and JavaScript references. Java and other runtimes are not installed. C++ uses 64-bit integers for counts; JavaScript integers are exact through 2⁵³−1. Inputs are bounded for learning.</p><p>Python and JavaScript run in a separate browser worker when a server runtime is not connected. Python downloads its runtime on first use. Runs stop after 6 seconds and can be cancelled. C++ needs the local or hosted compiler. Drafts stay in this browser.</p></div>}
    {runtime&&!canRun&&<div className="trace-notice">C++ needs a connected compiler. Your code is saved; choose Python or JavaScript to run here.</div>}

   </section>
  </div>
  <details className="studio-learning"><summary>Problem details & walkthrough · 5 explained examples</summary>    <div className="learning-note"><strong>Watch for this</strong><p>{p.caveat}</p>{frame&&<code>{snapshot.code.split("\n")[frame.line-1]}</code>}<small>{language==="python"?"Python frames show state before each highlighted line; return frames show state at function exit.":"Automatic steps show state before a statement. Explicit checkpoints show state when called. Unknown custom types remain labeled rather than guessed."}</small></div><LearningGuide key={selectedExample} problem={p} selected={selectedExample} onSelect={chooseExample} running={running||!ready||!runtime?.languages.includes(language)} onPlay={example=>{const next=formatInput(example.input);setCustomMode(false);setInput(next);void run(true,next);document.getElementById('visual-workbench')?.scrollIntoView({behavior:'instant'});}}/></details>
  <div className="practice-entry"><div><h3>Ready to try it yourself?</h3><p>Three practice cases, progressive hints, and feedback on your own solution.</p></div><button disabled={running} onClick={()=>{switchExperience('practice');window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}}>Practice this concept <ArrowRight size={16}/></button></div>
  </>}
  <div className="problem-footer"><span>{problems.findIndex(x=>x.id===p.id)+1} of 100 · Your progress is saved locally</span><button disabled={p.id===problems.at(-1)?.id} onClick={()=>onProblem(problems[problems.findIndex(x=>x.id===p.id)+1].id)}>Next problem <ArrowRight size={14}/></button></div>
 </section>;
}
export function Curriculum({onExisting}:{onExisting:(id:string)=>void}){
 const [selected,setSelected]=useState<string|null>(null),[query,setQuery]=useState(""),[tier,setTier]=useState(0),[stage,setStage]=useState("all"),[completed,setCompleted]=useState<string[]>([]);
 useEffect(()=>{const sync=()=>{const id=new URLSearchParams(location.search).get("problem");setSelected(id&&problemById[id]?id:null);};sync();window.addEventListener("popstate",sync);return()=>window.removeEventListener("popstate",sync);},[]);
 useEffect(()=>{try{setCompleted(JSON.parse(localStorage.getItem("trace:curriculum:complete")??"[]"));}catch{}},[selected]);
 function select(id:string|null){setSelected(id);window.history.pushState(null,"",id?`?view=curriculum&problem=${id}`:"?view=curriculum");window.scrollTo({top:0,behavior:"instant"});}
 if(selected)return <ProblemStudio key={selected} problem={problemById[selected]} onBack={()=>select(null)} onProblem={select} onExisting={onExisting}/>;
 const filtered=problems.filter(p=>(!tier||p.tier===tier)&&(stage==="all"||p.stage===stage)&&`${p.title} ${patterns[p.group-1]} ${p.scene}`.toLowerCase().includes(query.toLowerCase()));
 return <section className="curriculum"><div className="curriculum-heading"><div><div className="eyebrow mint">THE COMPLETE PATTERN ROADMAP</div><h1>Learn the pattern.<br/><span>See the code come alive.</span></h1><p>25 patterns. Four levels of understanding. Edit, run, and inspect the state behind every decision.</p></div><div className="curriculum-count"><strong>{completed.length}<span>/100</span></strong><small>problems understood</small><div><i style={{width:`${completed.length}%`}}/></div></div></div>
 <div className="curriculum-search"><label><Search size={16}/><input aria-label="Search problems or patterns" placeholder="Search problems, patterns, or structures…" value={query} onChange={e=>setQuery(e.target.value)}/></label><select aria-label="Problem progression" value={stage} onChange={e=>setStage(e.target.value)}><option value="all">All progression levels</option>{["Concept","Direct","Disguised","Edge-case trap"].map(s=><option key={s}>{s}</option>)}</select></div>
 <div className="tier-filter"><button className={tier===0?"selected":""} onClick={()=>setTier(0)}>All tiers <span>100</span></button>{tiers.map((t,i)=><button title={t} key={t} className={tier===i+1?"selected":""} onClick={()=>setTier(i+1)}>Tier {i+1}<span>{[28,24,20,28][i]}</span></button>)}</div>
 <p className="curriculum-summary">{filtered.length} problems · Concept → Direct → Disguised → Edge-case trap · Existing lessons are linked</p>
 {tiers.map((t,i)=>{const items=filtered.filter(p=>p.tier===i+1);if(!items.length)return null;return <div key={t} className="curriculum-tier"><h2><span>0{i+1}</span>{t}</h2>{patterns.map((pattern,g)=>{const group=items.filter(p=>p.group===g+1);if(!group.length)return null;return <div className="pattern-group" key={pattern}><div className="pattern-label"><span>{String(g+1).padStart(2,"0")}</span><h3>{pattern}</h3></div><div className="problem-grid">{group.map(p=><button key={p.id} onClick={()=>select(p.id)} className={`problem-card ${completed.includes(p.id)?"done":""}`}><span className="problem-stage">{p.stage}{completed.includes(p.id)?<Check size={13}/>:<ArrowRight size={13}/>}</span><strong>{p.title}</strong><span className="problem-card-bottom">{p.existing?"Existing lesson linked":p.scene+" visualization"}<span>Explore ↗</span></span></button>)}</div></div>;})}</div>;})}
 {!filtered.length&&<p className="trace-empty">No matching problems. Try a broader search or another tier.</p>}
 </section>;
}

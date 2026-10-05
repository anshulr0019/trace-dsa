"use client";
import {motion,AnimatePresence,useReducedMotion,MotionConfig} from "motion/react";
import {ArrayStage} from "./array-stage";
import {ConceptStage} from "./visuals/concept-stage";
import type {ConceptCue} from "@/lib/curriculum/concept-cues";
import {createContext,useContext} from 'react';
import type {Problem} from "@/lib/curriculum/catalog";
const SceneTiming=createContext(.3);
export interface ExecutionFrame {line:number;event:string;function:string;vars:Record<string,unknown>;stack:{name:string;line:number}[]}
export function display(v:unknown):string{return typeof v==="string"?v:JSON.stringify(v)??"—";}
const arr=(v:unknown):unknown[]=>Array.isArray(v)?v:[];
const obj=(v:unknown):Record<string,unknown>=>v&&typeof v==="object"&&!Array.isArray(v)?v as Record<string,unknown>:{};
const simple=(v:unknown)=>v===null||["number","string","boolean"].includes(typeof v);
const pointerNames=["left","right","mid","i","j","slow","fast","current","previous","following","start","end"];
function Cells({name,values,state,previous,cue,range,found}:{name:string;values:unknown[];state:Record<string,unknown>;previous?:unknown[];cue?:ConceptCue;range?:[number,number];found?:number[]}){
 const duration=useContext(SceneTiming);
 return <ArrayStage name={name} values={values} state={state} previous={previous} cue={cue} duration={duration} range={range} found={found}/>;
}

function Matrix({name,values,state,previous}:{name:string;values:unknown[][];state:Record<string,unknown>;previous:unknown[][]}){
 const row=state.row??state.r??state.i, col=state.col??state.c??state.j;
 const visited=arr(state.visited).map(display);
 return <div className="state-collection"><label>{name}<span>{values.length} × {values[0]?.length??0}</span></label><div className="trace-matrix">{values.slice(0,32).map((cells,r)=><div key={r}><small>{r}</small>{cells.slice(0,32).map((value,c)=><motion.span layout key={c} title={`[${r}][${c}] = ${display(value)}`} className={`${r===row&&c===col?"current":""} ${visited.includes(display([r,c]))?"visited":""} ${previous[r]&&display(previous[r]?.[c])!==display(value)?"changed":""}`}>{display(value)}</motion.span>)}</div>)}</div>{values.length>32||values.some(v=>v.length>32)?<small>Viewport shows the first 32 rows and columns.</small>:null}</div>;
}
type Node={id:string;label:string;x:number;y:number};
function Network({nodes,edges,state}:{nodes:Node[];edges:{from:string;to:string;label?:string}[];state:Record<string,unknown>}){
 const reduced=useReducedMotion();
 const duration=useContext(SceneTiming);
 const height=Math.max(220,...nodes.map(n=>n.y+55));
 return <div className="network-scroll"><svg role="img" aria-label="Live node and edge diagram" viewBox={`0 0 700 ${height}`} style={{minWidth:Math.min(700,Math.max(400,nodes.length*35))}}><defs><marker id="curr-arrow" viewBox="0 0 10 10" refX="55" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#657e71"/></marker></defs><AnimatePresence>{edges.map((edge,i)=>{
  const a=nodes.find(n=>n.id===edge.from),b=nodes.find(n=>n.id===edge.to);if(!a||!b)return null;
  return <motion.g key={`${edge.from}-${edge.to}-${i}`} initial={reduced?false:{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><motion.path initial={false} animate={{d:a===b?`M ${a.x-15} ${a.y-15} C ${a.x-70} ${a.y-85},${a.x+70} ${a.y-85},${a.x+15} ${a.y-15}`:a.y===b.y?`M ${a.x} ${a.y} Q ${(a.x+b.x)/2} ${a.y-45} ${b.x} ${b.y}`:`M ${a.x} ${a.y} L ${b.x} ${b.y}`}} transition={{duration:reduced?0:duration}} fill="none" stroke={String(state.current??state.u??state.node)===edge.from?"#b5e9c4":"#52685e"} strokeWidth={String(state.current??state.u??state.node)===edge.from?3:1.5} markerEnd="url(#curr-arrow)"/>{edge.label&&<text x={(a.x+b.x)/2} y={(a.y+b.y)/2-12} className="edge-label">{edge.label}</text>}</motion.g>;
 })}</AnimatePresence>{nodes.map(node=>{
  const pointers=["current","slow","fast","previous","following","head","tail","neighbor","root","x"].filter(k=>String(state[k])===node.id);
  return <motion.g key={node.id} initial={false} animate={{x:node.x,y:node.y}} transition={{duration:reduced?0:duration}}><motion.circle r="23" initial={false} animate={{fill:pointers.length?"#b5e9c4":"#182721",stroke:pointers.length?"#b5e9c4":"#476154"}}/><text textAnchor="middle" y="4" fill={pointers.length?"#14251a":"#dbe9de"}>{node.label.slice(0,9)}</text><text className="node-index" textAnchor="middle" y="40">{node.id}{pointers.length?` · ${pointers.join("/")}`:""}</text></motion.g>;
 })}</svg></div>;
}
function Structure({p,state,input}:{p:Problem;state:Record<string,unknown>;input:Record<string,unknown>}){
 let nodes:Node[]=[], edges:{from:string;to:string;label?:string}[]=[];
 if(p.scene==="linked"){
  const values=arr(state.nodes??state.nums??input.values??input.nums);
  const links=arr(state.links??(p.id==="duplicate-number"?input.nums:values.map((_,i)=>i+1<values.length?i+1:(input.pos??-1))));
  nodes=values.slice(0,24).map((v,i)=>({id:String(i),label:display(v),x:50+(i%8)*85,y:100+Math.floor(i/8)*110}));
  edges=links.map((to,i)=>({from:String(i),to:String(to)}));
  if(p.id==="copy-random-list")edges.push(...arr(input.random).map((to,i)=>({from:String(i),to:String(to),label:"random"})));
 }else if(p.scene==="tree"){
  let values=arr(state.nodes),left=arr(state.left_child),right=arr(state.right_child);
  if(!values.length){const raw=arr(input.tree);values=raw.length&&raw[0]!=null?[raw[0]]:[];left=[-1];right=[-1];const q=[0];let k=1;while(q.length&&k<raw.length){const n=q.shift()!;for(const children of [left,right]){const v=raw[k++];if(v!=null){children[n]=values.length;q.push(values.length);values.push(v);left.push(-1);right.push(-1);}}}}
  const place=(id:number,x:number,y:number,spread:number,seen=new Set<number>())=>{if(id<0||id>=values.length||seen.has(id)||nodes.length>=40)return;seen.add(id);nodes.push({id:String(id),label:display(values[id]),x,y});[left[id],right[id]].forEach((child,i)=>{if(typeof child==="number"&&child>=0){edges.push({from:String(id),to:String(child)});place(child,x+(i?1:-1)*spread,y+85,spread/2,seen);}});};place(0,350,45,165);
  if(p.id==="next-right-pointers")arr(state.links).forEach((to,i)=>{if(typeof to==="number"&&to>=0)edges.push({from:String(i),to:String(to),label:"next"});});
 }else if(p.scene==="trie"){
  const trie=obj(state.trie);let count=0;const levels:Record<number,Node[]>={};
  const walk=(branch:Record<string,unknown>,id:string,depth:number,label:string)=>{if(count++>=40)return;const node={id,label:label+(branch.$?" •":""),x:0,y:45+depth*65};nodes.push(node);(levels[depth]??=[]).push(node);for(const [key,value]of Object.entries(branch)){if(key==="$"||!value||typeof value!=="object")continue;const next=id+key;edges.push({from:id,to:next});walk(obj(value),next,depth+1,key);}};walk(trie,"root",0,"∅");for(const row of Object.values(levels))row.forEach((n,i)=>n.x=700*(i+1)/(row.length+1));
 }else{
  const graph=state.graph;const adjacency=graph&&typeof graph==="object"?Object.entries(graph):[];
  const ids=new Set<string>();
  if(adjacency.length){for(const [from,neighbors]of adjacency){ids.add(from);for(const item of arr(neighbors)){const pair=Array.isArray(item)?item:[item];const to=String(pair[0]);ids.add(to);edges.push({from,to,label:pair.length>1?display(pair[1]):undefined});}}}
  else{const raw=arr(state.edges??input.edges??input.times??input.flights??input.prerequisites);for(const item of raw){const [a,b,w]=arr(item);if(a===undefined||b===undefined)continue;ids.add(String(a));ids.add(String(b));edges.push({from:String(a),to:String(b),label:w!==undefined?display(w):undefined});}if(!ids.size&&typeof input.n==="number")for(let i=0;i<Math.min(input.n,20);i++)ids.add(String(i));if(!ids.size)arr(input.wordList??input.words).forEach(v=>ids.add(String(v)));}
  if(state.parent&&typeof state.parent==="object"){Object.entries(state.parent).forEach(([id,parent])=>{ids.add(id);ids.add(String(parent));if(String(parent)!==id)edges.push({from:id,to:String(parent),label:"parent"});});}
  if(input.accounts)arr(input.accounts).forEach((_,i)=>ids.add(String(i)));
  nodes=[...ids].slice(0,30).map((id,i,a)=>({id,label:id,x:350+260*Math.cos(i/a.length*2*Math.PI-Math.PI/2),y:205+155*Math.sin(i/a.length*2*Math.PI-Math.PI/2)}));
 }
 return nodes.length?<Network nodes={nodes} edges={edges} state={state}/>:<p className="trace-empty">Step forward to construct the {p.scene}.</p>;
}
function Heap({name,values,state}:{name:string;values:unknown[];state:Record<string,unknown>}){
 const nodes=values.slice(0,31).map((v,i)=>{const level=Math.floor(Math.log2(i+1)),first=2**level-1;return {id:String(i),label:display(v),x:700*(i-first+.5)/2**level,y:45+level*75};});
 return <div className="state-collection"><label>{name}<span>heap order · array indices shown</span></label><Network nodes={nodes} edges={nodes.slice(1).map((n,i)=>({from:String(Math.floor(i/2)),to:n.id}))} state={state}/></div>;
}
type SceneProps={cue?:ConceptCue;problem:Problem;frame?:ExecutionFrame;previous?:ExecutionFrame;input:Record<string,unknown>;language?:string;speed?:number;source?:string;binding?:{name:string;kind:string;marker:string}};
export function Scene(props:SceneProps){
 const reduced=useReducedMotion(),duration=reduced?0:Math.min(.42,.55/(props.speed??1));
 return <SceneTiming.Provider value={duration}><MotionConfig reducedMotion="user" transition={{duration,ease:[.22,1,.36,1]}}>{props.binding ? <SceneContent {...props}/> : <ConceptStage {...props}/>}</MotionConfig></SceneTiming.Provider>;
}
function SceneContent({problem,frame,previous,input,language="python",binding,cue}:SceneProps){
 const reduced=useReducedMotion();
 if(binding){
  const value=frame?.vars[binding.name]??input[binding.name];
  if(value===undefined)return <div className="trace-empty">{binding.name} has not been recorded at this step.</div>;
  const key=({grid:'grid',stack:'stack',heap:'heap',tree:'tree',linked:'nodes',string:'s'} as Record<string,string>)[binding.kind]??'nums';
  const mapped={...frame?.vars,[key]:value,...(binding.marker?{i:frame?.vars[binding.marker]}:{})};
  return <SceneContent problem={{...problem,scene:binding.kind as Problem['scene']}} input={{[key]:value,...(binding.kind==='linked'?{values:value}:{})}} language={language} frame={frame?{...frame,vars:mapped}:undefined} previous={previous?{...previous,vars:{...previous.vars,[key]:previous.vars[binding.name]}}:undefined}/>;
 }

 const state=frame?.vars??{}, old=previous?.vars??{};
 const collections=Object.entries(state).filter(([k,v])=>k!=="data"&&Array.isArray(v));
 const structures=["linked","tree","graph","trie"].includes(problem.scene);
 const mainKeys=["nums1","nums2","nums","s","haystack","needle","height","heights","temperatures","grid","matrix","board","dp","intervals","points","ratings","gas","prices","piles","tokens"];
 const source={...input,...state};
 const chosen=Object.entries(source).filter(([k,v])=>mainKeys.includes(k)&&(Array.isArray(v)||typeof v==="string"));
 const names=new Set(chosen.map(([k])=>k));
 const secondary=collections.filter(([k])=>!names.has(k)&&!["nodes","left_child","right_child","links","graph","queue","tree"].includes(k));
 const render=(name:string,value:unknown)=>{
  const raw=typeof value==="string"?Array.from(value):arr(value);
  const values=name==="board"&&raw.every(v=>typeof v==="string")?raw.map(v=>Array.from(v as string)):raw;
  const primary=['nums','s','height'].includes(name);
  let range:[number,number]|undefined;
  if((primary&&[1,2,9].includes(problem.group))||(name==='nums'&&problem.id==='binary-search-standard')){
   let left=state.left,right=state.right;
   if(problem.id==='maximum-average-subarray'&&Number.isInteger(left)&&Number.isInteger(input.k))right=Number(left)+Number(input.k)-1;
   if(Number.isInteger(left)&&Number.isInteger(right)&&Number(left)>=0&&Number(right)<values.length&&Number(left)<=Number(right))range=[Number(left),Number(right)];
  }
  const found=frame?.event==='complete'&&name==='nums'?(problem.id==='binary-search-standard'&&Number.isInteger(state.answer)&&Number(state.answer)>=0?[Number(state.answer)]:problem.id==='two-sum-sorted'&&Array.isArray(state.answer)?state.answer.map(n=>Number(n)-1):[]):[];
  return values.length&&values.every(Array.isArray)?<Matrix key={name} name={name} values={values as unknown[][]} state={state} previous={arr(old[name]) as unknown[][]}/>:<Cells range={range} found={found} cue={name==="nums"?cue:undefined} key={name} name={name} values={values} state={state} previous={old[name]===undefined?undefined:arr(old[name])}/>;
 };
 return <div className="live-scene motion-stage">
  <div className="scene-caption"><span className="live-dot"/> {problem.scene.toUpperCase()} STATE <span>{frame?.event==="input"?"Input passed to solve":frame?.event==="complete"?"Execution complete":frame?.event==="error"?"Execution stopped":frame?`${frame.function} · ${frame.event==="line"?"before":"after"} line ${frame.line}`:"Input preview"}</span></div>
  {structures&&<Structure p={problem} state={state} input={input}/>}
  {problem.scene==="heap"&&["heap","lower","upper"].filter(k=>Array.isArray(state[k])).map(k=><Heap key={k} name={k+(k==="lower"&&language==="python"?" (negated max-heap values)":"")} values={arr(state[k])} state={state}/>)}
  {Array.isArray(state.queue)&&<div className="execution-queue"><label>Queue · next item on the left</label><Cells name="queue" values={arr(state.queue)} state={state} previous={arr(old.queue)}/></div>}
  {problem.scene==="stack"&&Array.isArray(state.stack)&&<div className="vertical-stack"><label>Stack · top first</label><AnimatePresence initial={false}>{[...arr(state.stack)].reverse().slice(0,100).map((v,i)=><motion.div layout={!reduced} initial={reduced?false:{opacity:0,x:-18}} animate={{opacity:1,x:0}} exit={{opacity:0,x:reduced?0:18}} key={arr(state.stack).length-i}>{display(v)}{i===0&&<small>← top</small>}</motion.div>)}</AnimatePresence>{!arr(state.stack).length&&<small>empty</small>}{arr(state.stack).length>100&&<small>Showing the top 100 of {arr(state.stack).length} values.</small>}</div>}
  {problem.scene==="interval"&&<div className="interval-plot">{arr(state.intervals??input.intervals??input.points).slice(0,20).map((interval,i)=>{const [a,b]=arr(interval).map(Number);const all=arr(input.intervals??input.points).flatMap(v=>arr(v).map(Number));const lo=Math.min(0,...all),hi=Math.max(1,...all);return <div key={i}><small>{i}</small><motion.span layout style={{marginLeft:`${(a-lo)/(hi-lo)*65}%`,width:`${Math.max(1,(b-a)/(hi-lo)*65)}%`}}>{a} — {b}</motion.span></div>;})}</div>}
  {problem.scene==="bits"&&Object.entries({...input,...state}).filter(([k,v])=>["a","b","n","result","carry","value","rolling"].includes(k)&&typeof v==="number").map(([k,v])=><div className="bit-row" key={k}><label>{k}<b>{String(v)}</b></label><div>{(Number(v)>>>0).toString(2).padStart(32,"0").split("").map((bit,i)=><span key={i} className={bit==="1"?"set":""}>{bit}</span>)}</div></div>)}
  {chosen.map(([name,value])=>render(name,value))}
  {secondary.map(([name,value])=>render(name,value))}
  {Object.entries(state).filter(([k,v])=>k!=="data"&&!simple(v)&&!Array.isArray(v)).map(([name,value])=><div className="state-collection" key={name}><label>{name}</label><div className="map-state">{Object.entries(obj(value)).slice(0,40).map(([k,v])=><span key={k}><b>{k}</b>{display(v)}</span>)}</div></div>)}
  <div className="motion-legend"><span><i className="mint-key"/>Current / active</span><span><i className="amber-key"/>Scanning</span><span><i className="blue-key"/>Changed / inspected</span></div>
  {frame&&frame.stack?.length>1&&<div className="call-stack"><label>Call stack</label><AnimatePresence initial={false}>{frame.stack.map((call,i)=><motion.span layout={!reduced} initial={reduced?false:{opacity:0,x:12}} animate={{opacity:1,x:0}} exit={{opacity:0,x:reduced?0:-12}} key={`${call.name}:${i}`}>{call.name} : {call.line}</motion.span>)}</AnimatePresence></div>}
 </div>;
}

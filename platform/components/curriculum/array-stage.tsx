"use client";
import {useId,useState} from 'react';
import {motion,useReducedMotion} from 'motion/react';
import {ArrowDown,Check,MousePointer2} from 'lucide-react';
import type {ConceptCue} from '@/lib/curriculum/concept-cues';
const GAP=62;
const format=(value:unknown)=>typeof value==='string'?value:JSON.stringify(value)??'—';
const markers=['left','right','mid','i','j','slow','fast','current','previous','following','start','end'];
export function ArrayStage({name,values,state,previous,cue,duration,range,found=[]}:{name:string;values:unknown[];state:Record<string,unknown>;previous?:unknown[];cue?:ConceptCue;duration:number;range?:[number,number];found?:number[]}){
 const reduced=useReducedMotion(),scope=useId(),[selected,setSelected]=useState<number|null>(null);
 const shown=values.slice(0,100),pointers=markers.filter(k=>Number.isInteger(state[k])&&Number(state[k])>=0&&Number(state[k])<shown.length);
 const rows=Math.max(1,...pointers.map(k=>pointers.filter(p=>state[p]===state[k]).length));
 const offset=Math.max(0,rows-2)*30,counts=new Map<string,number>();
 const transition={duration:reduced?0:duration,ease:[.22,1,.36,1] as [number,number,number,number]};
 return <section className="roadmap-array" aria-label={`${name} visualization`}>
  <div className="stage-topline"><span>{name}</span><span className="stage-size">{values.length} values</span></div>
  <div className="motion-scroll" tabIndex={0} aria-label={`${name}: scroll horizontally for longer arrays`}>
   <div className="motion-canvas" style={{width:Math.max(shown.length*GAP-10,280),height:190+offset}}>
    {range&&range[0]<=range[1]&&<motion.div className="moving-region search-region" initial={false} animate={{x:range[0]*GAP-5,width:(range[1]-range[0]+1)*GAP-2}} transition={transition} style={{top:59+offset}}/>}
    {pointers.map((pointer,i)=>{const row=pointers.slice(0,i).filter(p=>state[p]===state[pointer]).length;return <motion.div key={pointer} className={`moving-pointer ${pointer==='right'||pointer==='j'?'amber':pointer==='mid'?'blue':'mint'}`} initial={false} animate={{x:Number(state[pointer])*GAP,y:row*30}} transition={transition}><span>{pointer}</span><ArrowDown size={14}/></motion.div>;})}
    <div className="motion-tiles" style={{top:65+offset}}>{shown.map((value,i)=>{
     const identity=format(value),occurrence=counts.get(identity)??0;counts.set(identity,occurrence+1);
     const changed=previous!==undefined&&format(previous[i])!==identity,mark=cue?.marks[i];
     return <motion.button layout={!reduced} layoutId={`${scope}-${identity}-${occurrence}`} key={`${identity}:${occurrence}`} transition={transition} className={`motion-tile ${changed?'read-tile':''} ${range&&(i<range[0]||i>range[1])&&!mark?'eliminated-tile':''} ${found.includes(i)?'found-tile':''} ${selected===i?'selected-tile':''} ${mark?'roadmap-marked':''}`} aria-label={`${name}[${i}] = ${identity}${mark?`, ${mark}`:''}. Inspect value`} aria-pressed={selected===i} onClick={()=>setSelected(selected===i?null:i)}><span title={identity}>{identity.length>8?identity.slice(0,7)+'…':identity}</span><small>{i}</small>{mark&&<em className={`roadmap-cell-cue ${mark==='leaves'?'amber':'mint'}`}>{mark}</em>}{found.includes(i)&&<Check className="tile-check" size={13}/>}</motion.button>;
    })}{!shown.length&&<div className="empty-stage">Empty collection<span>Step through to explore the boundary case.</span></div>}</div>
   </div>
  </div>
  {selected!==null&&selected<values.length&&<div className="stage-readout"><MousePointer2 size={15}/><span>{name}[{selected}]</span><strong>{format(values[selected])}</strong><button onClick={()=>setSelected(null)} aria-label="Close value inspector">×</button></div>}
  {values.length>100&&<p className="trace-notice">Showing the first 100 of {values.length} values.</p>}
 </section>;
}

"use client";
import { useState } from "react";
import { motion, useMotionValue, useReducedMotion, useTransform, type MotionValue } from "motion/react";
import { ArrowDown, ArrowRight, Check, Columns3, BarChart3, MousePointer2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import type { Frame, Access } from "@/lib/trace/interpreter";
import type { Lesson } from "@/lib/lessons";

const GAP = 62, TILE = 52;
const ease = (t: number) => t < .5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2;
const number = (v: unknown, fallback = -1) => typeof v === "number" && Number.isFinite(v) ? v : fallback;
function Pointer({ name, from, to, phase, tone, row = 0 }: { name: string; from: number; to: number; phase: MotionValue<number>; tone: string; row?: number }) {
  const reduced = useReducedMotion();
  const x = useTransform(phase, p => ((reduced ? to : from + (to-from)*ease(p))) * GAP);
  return <motion.div className={`moving-pointer ${tone}`} style={{ x, top: row * 24 }}><span>{name}</span><ArrowDown size={14}/></motion.div>;
}
function Region({ start, end, nextStart, nextEnd, phase, className }: {start:number;end:number;nextStart:number;nextEnd:number;phase:MotionValue<number>;className:string}) {
  const reduced = useReducedMotion();
  const x = useTransform(phase,p=>(start+(nextStart-start)*(reduced?1:ease(p)))*GAP-5);
  const width = useTransform(phase,p=> Math.max(0,(end-start+1+(nextEnd-nextStart-end+start)*(reduced?1:ease(p)))*GAP-2));
  return <motion.div className={`moving-region ${className}`} style={{x,width}}/>;
}
function position(access: Access, length: number): [number,number] | undefined {
  if(access.name === "nums" && access.index !== undefined) return [access.index*GAP, 65];
  if(access.name === "prefix" && access.index !== undefined) return [access.index*GAP, 157];
  if(access.name === "key" || access.name === "temp") return [Math.max(0,(length-1)*GAP/2), 160];
  return undefined;
}
function Transfer({source,write,length,phase}: {source:Access;write:Access;length:number;phase:MotionValue<number>}) {
  const a=position(source,length), b=position(write,length);
  const reduced=useReducedMotion();
  const x=useTransform(phase,p=>a&&b?a[0]+(b[0]-a[0])*ease(p):0);
  const y=useTransform(phase,p=>a&&b?a[1]+(b[1]-a[1])*ease(p)-Math.sin(Math.PI*p)*36:0);
  const opacity=useTransform(phase,p=>reduced||p===0||p===1?0:Math.min(p*8,(1-p)*8,1));
  if(!a||!b||Array.isArray(source.value)||source.value===null) return null;
  return <motion.div aria-hidden="true" className="value-transfer" style={{x,y,opacity}}>{String(source.value)}</motion.div>;
}
export function describeFrame(frame:Frame, lesson:Lesson, custom=false) {
  const e=frame.event, v=frame.vars;
  if(e?.kind==="complete") return "Execution complete. Inspect the result, or change the input and explore again.";
  if(!frame.line) return "Press play to follow each decision. You can pause, inspect a value, or step backward at any time.";
  if(custom) return frame.message;
  if(e?.write?.name==="left" && lesson.id==="two-sum" && Number(v.left)>0) return "The sum was too small. Move left forward to try a larger value; every smaller partner has been ruled out.";
  if(e?.write?.name==="right" && lesson.id==="two-sum" && Number(v.right)<(v.nums as number[]).length-1) return "The sum was too large. Move right backward to try a smaller value.";
  if(e?.write?.name==="mid") return `Inspect the middle candidate at index ${v.mid}. Sorted order tells us which half can still contain the target.`;
  if(e?.write?.name==="key") return `Hold ${v.key} aside. Shift larger values right until its insertion position is available.`;
  if(e?.write?.name==="temp") return `Keep ${v.temp} in temporary storage before overwriting its array position.`;
  if(e?.write?.index!==undefined) return `${e.write.name}[${e.write.index}] receives ${String(e.write.value)}${e.source?` from ${e.source.name}${e.source.index!==undefined?`[${e.source.index}]`:""}`:""}.`;
  if(e?.kind==="condition") { const values=e.reads.filter(r=>r.index!==undefined); return `${values.length?`Inspect ${values.map(r=>`${r.name}[${r.index}] = ${r.value}`).join(" and ")}. `:""}The condition is ${e.truth?"true":"false"}; follow the highlighted branch.`; }
  if(e?.write?.name==="total" && lesson.id==="sliding-window") return `The running sum is now ${v.total}. During a window update, add the entering value before subtracting the leaving one.`;
  return frame.message;
}
export function MotionStage({frame,nextFrame=frame,phase:givenPhase,lesson,custom=false,compact=false}: {frame:Frame;nextFrame?:Frame;phase?:MotionValue<number>;lesson:Lesson;custom?:boolean;compact?:boolean}) {
  const staticPhase=useMotionValue(1), phase=givenPhase??staticPhase;
  const [bars,setBars]=useState(false), [selected,setSelected]=useState<number|null>(null), [range,setRange]=useState([0,2]);
  const nums=Array.isArray(frame.vars.nums)?frame.vars.nums:[];
  const nextNums=Array.isArray(nextFrame.vars.nums)?nextFrame.vars.nums:nums;
  const vars=frame.vars, next=nextFrame.vars, n=nums.length;
  const sorting=lesson.category==="Sorting", prefix=lesson.id==="prefix-sum"&&!custom;
  const event=nextFrame===frame?frame.event:nextFrame.event;
  const reads=new Set(event?.reads.filter(r=>r.name==="nums"&&r.index!==undefined).map(r=>r.index));
  const pointers=Object.entries(next).filter(([name,value])=>["left","right","mid","i","j"].includes(name)&&typeof value==="number"&&value>=0&&value<n);
  const left=number(vars.left,0), right=number(vars.right,n-1), nl=number(next.left,left), nr=number(next.right,right);
  const bounded=(a:number)=>Math.max(0,Math.min(n,a));
  const isSearch=!custom&&(lesson.id==="two-sum"||lesson.id==="binary-search");
  const isWindow=!custom&&lesson.id==="sliding-window";
  const done=frame.event?.kind==="complete"||frame.message.startsWith("Execution complete");
  const max=Math.max(...nums.map(Math.abs),1);
  const prefixValues=Array.isArray(vars.prefix)?vars.prefix:[];
  const lo=Math.min(range[0],Math.max(0,n-1)), hi=Math.max(lo,Math.min(range[1],Math.max(0,n-1)));
  const rangeReady=done&&prefixValues.length===n+1;
  return <div className={`motion-stage ${compact?"compact-stage":""}`} data-testid="motion-stage">
    <div className="stage-topline"><span><span className="stage-live-dot"/> {custom?"Execution state":lesson.category}</span><div>{sorting&&<button className="stage-view-switch" onClick={()=>setBars(v=>!v)} aria-label={bars?"Show array tiles":"Show sorting bars"}>{bars?<Columns3 size={15}/>:<BarChart3 size={15}/>} {bars?"Tiles":"Bars"}</button>}<span className="stage-size">{n} values</span></div></div>
    <div className="motion-scroll" tabIndex={0} aria-label="Algorithm visualization. Scroll horizontally for longer arrays.">
      <div className={`motion-canvas ${prefix||sorting?"tall-canvas":""}`} style={{width:Math.max(n*GAP-10,prefix?(n+1)*GAP-10:0,280)}}>
        {n>0&&isSearch&&<Region phase={phase} start={bounded(left)} end={Math.max(left-1,Math.min(n-1,right))} nextStart={bounded(nl)} nextEnd={Math.max(nl-1,Math.min(n-1,nr))} className="search-region"/>}
        {n>0&&isWindow&&<Region phase={phase} start={left} end={Math.min(n-1,left+number(vars.k,1)-1)} nextStart={nl} nextEnd={Math.min(n-1,nl+number(next.k,1)-1)} className="window-region"/>}
        {pointers.map(([name,v],i)=><Pointer key={name} name={name} from={number(vars[name],Number(v))} to={Number(v)} phase={phase} tone={name==="right"||name==="j"?"amber":name==="mid"?"blue":"mint"} row={pointers.slice(0,i).some(([,x])=>x===v)?1:0}/>)}
        <div className="motion-tiles" style={{top:65}}>
          {nums.map((value,i)=>{
            const eliminated=isSearch&&(i<left||i>right);
            const settled=sorting&&!custom&&(done||(lesson.id==="bubble-sort"&&typeof vars.end==="number"&&i>vars.end)||(lesson.id==="insertion-sort"&&typeof vars.i==="number"&&i<vars.i));
            const found=done&&!custom&&((lesson.id==="two-sum"&&Array.isArray(vars.result)&&vars.result.includes(i))||(lesson.id==="binary-search"&&vars.result===i));
            return <button key={i} className={`motion-tile ${reads.has(i)?"read-tile":""} ${eliminated?"eliminated-tile":""} ${settled?"settled-tile":""} ${found?"found-tile":""} ${selected===i?"selected-tile":""} ${bars?"bar-tile":""}`} aria-label={`Index ${i}, value ${value}. Inspect value`} aria-pressed={selected===i} onClick={()=>setSelected(selected===i?null:i)} style={bars?{height:42+Math.abs(value)/max*48,marginTop:-(Math.abs(value)/max*48)}:undefined}><span>{value}</span><small>{i}</small>{found&&<Check className="tile-check" size={13}/>}</button>;
          })}
          {!n&&<div className="empty-stage">An empty array.<span>Step through to explore the boundary case.</span></div>}
        </div>
        {prefix&&<div className="prefix-track" style={{top:157}}><span className="track-label">prefix</span>{prefixValues.map((v,i)=><div className={`prefix-tile ${rangeReady&&(i===lo||i===hi+1)?"selected-prefix":""}`} key={i}>{v}<small>{i}</small></div>)}</div>}
        {sorting&&<div className="holding-slot" style={{left:Math.max(0,(n-1)*GAP/2),top:157}}><span>{lesson.id==="insertion-sort"?"key":"temp"}</span><strong>{String(vars[lesson.id==="insertion-sort"?"key":"temp"]??"—")}</strong></div>}
        {event?.source&&event.write&&nextFrame!==frame&&<Transfer source={event.source} write={event.write} length={n} phase={phase}/>}
      </div>
    </div>
    <div className="stage-readout step-transition" key={JSON.stringify([vars,selected])}>
      {selected!==null&&selected<n?<><MousePointer2 size={15}/><span>nums[{selected}]</span><strong>{nums[selected]}</strong><button onClick={()=>setSelected(null)} aria-label="Close value inspector">×</button></>:
      isSearch&&typeof vars.left==="number"&&typeof vars.right==="number"&&left>=0&&right<n&&left<=right?<>{lesson.id==="two-sum"?<><b className="mint">{nums[left]}</b><span>+</span><b className="amber">{nums[right]}</b><span>=</span><strong>{nums[left]+nums[right]}</strong></>:<><span>midpoint</span><strong>{typeof vars.mid==="number"?nums[vars.mid]:"—"}</strong></>}<span className="readout-separator"/><span>target</span><strong>{String(vars.target)}</strong></>:
      isWindow?<><span>sum</span><strong>{String(vars.total??0)}</strong><ArrowRight size={16}/><span>best</span><strong className="mint">{String(vars.best??"—")}</strong></>:
      done?<><Check size={16}/><span>Result</span><strong>{JSON.stringify(vars.result??nums)}</strong></>:<><span>{prefix?"Build the cumulative totals":sorting?"Compare. Move. Understand.":"Ready to explore"}</span></>}
    </div>
    {prefix&&n>0&&!compact&&<div className="range-explorer"><div><span>Explore a range</span><strong>[{lo} … {hi}]</strong></div><Slider aria-label="Range boundaries" value={[lo,hi]} min={0} max={n-1} step={1} disabled={!rangeReady||n<2} onValueChange={setRange}/><p>{rangeReady?`prefix[${hi+1}] − prefix[${lo}] = ${prefixValues[hi+1]} − ${prefixValues[lo]} = ${prefixValues[hi+1]-prefixValues[lo]}`:"Finish the run to query any range."}</p></div>}
    {!compact&&<div className="motion-legend"><span><i className="mint-key"/> Current / active</span><span><i className="amber-key"/> Scanning</span><span><i className="blue-key"/> Inspected value</span></div>}
  </div>;
}

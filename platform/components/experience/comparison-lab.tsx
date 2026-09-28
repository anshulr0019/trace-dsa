"use client";
import { useMemo, useState } from "react";
import { Play, Pause, RotateCcw, SkipForward, ArrowRight, Check } from "lucide-react";
import { motion } from "motion/react";
import { Slider } from "@/components/ui/slider";
import { compareAlgorithms, type Lesson } from "@/lib/lessons";
import { comparisonTraces } from "@/lib/trace/comparisons";
import { MotionStage } from "./motion-stage";
import { usePlayback } from "./use-playback";
function Experiment({lesson,nums,parameter}: {lesson:Lesson;nums:number[];parameter:number}) {
  const traces=useMemo(()=>comparisonTraces(lesson.id,nums,parameter),[lesson.id,nums,parameter]);
  const comparison=useMemo(()=>compareAlgorithms(lesson.id,nums,parameter),[lesson.id,nums,parameter]);
  const count=Math.max(traces[0].length,traces[1].length);
  const playback=usePlayback(count,4);
  return <><div className="race-grid">{traces.map((frames,i)=>{
    const frame=frames[Math.min(playback.step,frames.length-1)],next=frames[Math.min(playback.target,frames.length-1)];
    const complete=playback.step>=frames.length-1;
    return <section className={`race-panel panel ${i?"race-alternative":""}`} key={i}><div className="race-title"><span className="eyebrow">{i?"02 / ALTERNATIVE":"01 / BASELINE"}</span><span>{i?comparison.optimizedBigO:comparison.baselineBigO}</span></div><h3>{i?comparison.optimized:comparison.baseline}</h3><div className="race-count"><strong>{frame.comparisons}</strong><span>{comparison.unit}</span>{complete&&<Check size={19}/>}</div><div className="race-progress"><motion.span initial={false} animate={{scaleX:frames.length<=1?1:frame.comparisons/(frames.length-1)}} style={{transformOrigin:"left"}}/></div><MotionStage compact custom lesson={{...lesson,category:"Comparison"}} frame={frame} nextFrame={next} phase={playback.phase}/><p className="race-message">{frame.message}</p></section>;
  })}</div><div className="race-controls panel"><button className="icon-button" onClick={()=>playback.seek(0)} aria-label="Reset comparison"><RotateCcw size={17}/></button><button className="button" onClick={()=>playback.setPlaying(p=>!p)} aria-label={playback.playing?"Pause comparison":"Play comparison"}>{playback.playing?<Pause size={16}/>:<Play size={16}/>} {playback.playing?"Pause":"Run both"}</button><button className="icon-button" onClick={()=>playback.move(playback.step+1)} disabled={playback.step>=count-1} aria-label="Next comparison operation"><SkipForward size={17}/></button><Slider aria-label="Comparison operation" value={[playback.step]} min={0} max={Math.max(1,count-1)} step={1} onValueChange={v=>playback.seek(v[0])}/><span>{playback.step} / {count-1}</span></div><div className="comparison-summary"><div><span className="eyebrow">AFTER BOTH RUNS</span><h3>{comparison.a===comparison.b?"The same amount of work.":comparison.a>comparison.b?`${comparison.a-comparison.b} fewer operations with the alternative.`:`${comparison.b-comparison.a} fewer operations with the baseline.`}</h3></div><p>{comparison.note}</p></div><p className="comparison-method">Playback advances one counted operation per side. These are reference runs; operation counts describe work, not elapsed time. The sorting comparison groups the moves following each comparison; Explore shows individual source statements.</p></>;
}
export function ComparisonLab({lesson,nums:original,parameter:originalParameter}: {lesson:Lesson;nums:number[];parameter:number}) {
  const [nums,setNums]=useState(original),[parameter,setParameter]=useState(originalParameter);
  const sample=(kind:string)=>{
    if(kind==="original"){setNums(original);setParameter(originalParameter);return;}
    if(lesson.category==="Sorting")setNums(kind==="ordered"?[...nums].sort((a,b)=>a-b):[...nums].sort((a,b)=>b-a));
    else if(lesson.parameter==="target")setParameter(kind==="first"?(lesson.id==="two-sum"?(nums[0]??0)+(nums[1]??0):nums[0]??0):Math.max(0,...nums)*3+1);
  };
  return <div className="comparison-lab"><div className="compare-intro"><div><div className="eyebrow mint">THE OPTIMIZATION JOURNEY</div><h2>Same input. Different work.</h2><p>Watch both approaches make their decisions, one operation at a time.</p></div></div><div className="experiment-controls"><div className="sample-buttons"><button onClick={()=>sample("original")}>Your input</button>{lesson.category==="Sorting"?<><button onClick={()=>sample("ordered")}>Already sorted</button><button onClick={()=>sample("reversed")}>Reverse order</button></>:lesson.parameter==="target"?<><button onClick={()=>sample("first")}>Early match</button><button onClick={()=>sample("missing")}>No match</button></>:null}</div><label>Input size <strong>{nums.length}</strong><Slider aria-label="Comparison input size" value={[nums.length]} min={2} max={16} step={1} onValueChange={([n])=>{setNums(Array.from({length:n},(_,i)=>lesson.category==="Sorting"?(i*7+3)%17:i*2+2));if(lesson.parameter==="k")setParameter(Math.min(parameter,n));}}/></label>{lesson.parameter!=="none"&&<span className="experiment-parameter">{lesson.parameter==="k"?"Window":"Target"} <b>{parameter}</b></span>}</div><Experiment key={`${lesson.id}:${nums.join(",")}:${parameter}`} lesson={lesson} nums={nums} parameter={parameter}/></div>;
}

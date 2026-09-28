"use client";
import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Brain, ArrowRight, Check, X } from "lucide-react";
import type { Frame } from "@/lib/trace/interpreter";
import type { Lesson } from "@/lib/lessons";
export type Prediction = { step:number; prompt:string; options:string[]; answer:number; explanation:string };
export function predictionAt(frames:Frame[], step:number, lesson:Lesson):Prediction|null {
  const f=frames[step], next=frames[step+1];
  if(!f||!next) return null;
  const v=f.vars, nums=Array.isArray(v.nums)?v.nums:[];
  if(lesson.id==="two-sum"&&f.event?.write?.name==="total") {
    const a=Number(v.total)===Number(v.target)?2:Number(v.total)<Number(v.target)?0:1;
    return {step,prompt:`The sum is ${v.total}; the target is ${v.target}. What should happen?`,options:["Move left forward","Move right backward","Keep this matching pair"],answer:a,explanation:a===2?"The selected pair matches the target.":a===0?"The sum is too small. Sorted order lets us discard the left value and try a larger one.":"The sum is too large. Moving right backward tries a smaller value."};
  }
  if(lesson.id==="binary-search"&&f.event?.write?.name==="mid") {
    const m=Number(v.mid), a=nums[m]===v.target?2:nums[m]<Number(v.target)?1:0;
    return {step,prompt:`The midpoint is ${nums[m]}; the target is ${v.target}. Where next?`,options:["Search the left half","Search the right half","The target is found"],answer:a,explanation:a===2?"The midpoint equals the target.":`Sorted order rules out the ${a===0?"right":"left"} half, including this midpoint.`};
  }
  if(lesson.category==="Sorting"&&next.event?.kind==="condition"&&next.event.reads.some(r=>r.name==="nums")) {
    const shift=lesson.id==="insertion-sort", truth=next.event.truth;
    return {step,prompt:shift?`Should the value before the insertion slot shift right?`:`Should these adjacent values swap?`,options:shift?["Shift it right","Keep it in place"]:["Swap the values","Keep this order"],answer:truth?0:1,explanation:truth?shift?"This value is greater than the held key, so it shifts one position right.":"The left value is greater than its neighbor; the swap moves the larger value right.":"The values already satisfy this comparison. No movement is needed."};
  }
  const write=next.event?.write;
  if((lesson.id==="sliding-window"&&write?.name==="total"&&typeof v.total==="number")||(lesson.id==="prefix-sum"&&write?.name==="prefix"&&write.index!==undefined)) {
    const answer=Number(write?.value);if(!Number.isFinite(answer))return null;
    const options=[answer-2,answer,answer+3]; const rotation=step%3;const ordered=[...options.slice(rotation),...options.slice(0,rotation)];
    return {step,prompt:lesson.id==="prefix-sum"?`What will prefix[${write?.index}] contain after this addition?`:"What will the running sum be after the next highlighted operation?",options:ordered.map(String),answer:ordered.indexOf(answer),explanation:lesson.id==="prefix-sum"?"Add the next input value to the previous cumulative total.":"Apply the addition or subtraction on the next source line. The window update may require another operation afterward."};
  }
  return null;
}
export function PredictionCard({question,onContinue}: {question:Prediction;onContinue:()=>void}) {
  const [choice,setChoice]=useState<number|null>(null);const reduced=useReducedMotion();
  return <motion.div className="prediction-card" role="region" aria-label="Prediction checkpoint" initial={{opacity:0,y:reduced?0:10}} animate={{opacity:1,y:0}}>
    <div className="prediction-label"><Brain size={17}/> YOUR TURN <span>Playback paused</span></div>
    <h3>{question.prompt}</h3><div className="prediction-options">{question.options.map((o,i)=><button key={o} disabled={choice!==null} className={choice===null?"":i===question.answer?"correct":choice===i?"incorrect":""} onClick={()=>setChoice(i)}>{o}{choice!==null&&i===question.answer&&<Check size={15}/>}</button>)}</div>
    {choice!==null&&<p role="status">{choice===question.answer?"Exactly. ":"Let's trace it. "}{question.explanation}</p>}
    <button className="text-button" onClick={onContinue}>{choice===null?"Reveal through execution":"Continue execution"}<ArrowRight size={15}/></button>
  </motion.div>;
}

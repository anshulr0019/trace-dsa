"use client";
import type {ConceptCue} from "@/lib/curriculum/concept-cues";
import {display,type ExecutionFrame} from './scene';
import type {Example} from '@/lib/curriculum/learning-types';

function Preview({input}:{input:Record<string,unknown>}){
 const data=Object.values(input).find(v=>Array.isArray(v)||typeof v==='string')??Object.values(input);
 const values=typeof data==='string'?[...data]:Array.isArray(data)?data:[];
 return <span className="mini-preview" aria-hidden="true">{values.slice(0,8).map((v,i)=><span key={i}>{Array.isArray(v)?v.slice(0,4).join('·'):v===null?'∅':String(v).slice(0,6)}</span>)}{values.length>8&&<span>…</span>}{values.length===0&&<span>empty</span>}</span>;
}
export function ExampleShelf({examples,selected,onSelect,disabled,batch}:{examples:Example[];selected:number;onSelect:(n:number)=>void;disabled:boolean;batch:string[]}){
 return <section className="example-shelf" aria-label="Visual examples"><div className="shelf-heading"><strong>Choose an input</strong><span>5 explained examples + your own input</span></div><div className="example-tiles">{examples.map((e,i)=><button key={i} disabled={disabled} aria-pressed={selected===i} onClick={()=>onSelect(i)}><span className="example-number">EXAMPLE {i+1} {batch[i]&&<b>{batch[i]}</b>}</span><strong>{e.label}</strong><Preview input={e.input}/></button>)}<button disabled={disabled} aria-pressed={selected===-1} onClick={()=>onSelect(-1)}><span className="example-number">YOUR INPUT</span><strong>Try your own values</strong><span className="mini-preview"><span>＋</span></span></button></div></section>;
}
function explainLine(line:string,vars:Record<string,unknown>){
 const source=line.trim();
 const slide=/^(\w+)\s*\+=\s*(\w+)\[(\w+)\]\s*-\s*\2\[(\w+)\]\s*;?$/.exec(source);
 if(slide){
  const [,total,array,right,left]=slide;
  const values=vars[array],incoming=vars[right],outgoing=vars[left];
  if(Array.isArray(values)&&Number.isInteger(incoming)&&Number.isInteger(outgoing)&&Number(incoming)>=0&&Number(outgoing)>=0&&Number(incoming)<values.length&&Number(outgoing)<values.length)
   return `Next, add ${display(values[Number(incoming)])} from ${array}[${incoming}] and subtract ${display(values[Number(outgoing)])} from ${array}[${outgoing}] to update ${total}.`;
  return `Next, add the incoming ${array} value and subtract the outgoing value to update ${total}.`;
 }
 if(/^return\b/.test(source))return 'Next, return the answer calculated by this expression.';
 if(/^(if|elif|else if)\b/.test(source))return 'Next, check this condition to decide which path the code takes.';
 if(/^(for|while)\b/.test(source))return 'Next, check whether the loop should run another step.';
 if(/^\w+\s*(?:\[[^\]]+\])?\s*(?:=|\+=|-=|\*=|\/=)/.test(source))return 'Next, calculate this expression and update the value on the left.';
 return 'The highlighted line runs next. Step forward to see its effect.';
}
export function ExecutionInspector({frame,previous,code,cue}:{cue?:ConceptCue;frame?:ExecutionFrame;previous?:ExecutionFrame;code:string}){
 if(!frame)return <section className="step-story step-story-empty" aria-label="Current step explanation"><strong>Follow the code, step by step</strong><p>Run the solution to see each decision and the variables it changes.</p></section>;
 const changes=Object.entries(frame.vars).filter(([k,v])=>k!=='data'&&k!=='input'&&display(v)!==display(previous?.vars[k])).slice(0,8);
 const source=frame.line>0?code.split('\n')[frame.line-1]??'':'';
 const title=frame.event==='input'?'Starting values':frame.event==='error'?'Execution stopped':frame.event==='complete'?'Execution finished':frame.event==='line'?`Next: line ${frame.line}`:`Checkpoint after line ${frame.line}`;
 const summary=frame.event==='input'?'These values were passed into solve(data).':frame.event==='error'?'The run stopped here. Check Output & errors for the cause.':frame.event==='complete'?'The function has returned its answer.':frame.event==='line'?explainLine(source,frame.vars):'The program recorded this state after the highlighted line.';
 return <section className="step-story" aria-label="Current step explanation" tabIndex={0}><div className="step-transition" key={JSON.stringify(frame)}><span className="step-story-label">CURRENT STEP</span><strong>{title}</strong><p className="step-story-summary">{cue?.text??summary}</p>{cue?.equation&&<div className="concept-equation">{cue.equation}</div>}{source&&<code>{source}</code>}{changes.length?<><span className="step-story-label">{previous?'CHANGED SINCE LAST STEP':'INITIAL VALUES'}</span><dl>{changes.map(([name,value])=><div key={name}><dt>{name}</dt><dd><span>{previous&&name in previous.vars?display(previous.vars[name]):'not yet recorded'}</span><b> → </b><strong>{display(value)}</strong></dd></div>)}</dl></>:<p className="step-story-unchanged">No recorded values changed at this step.</p>}</div></section>;
}

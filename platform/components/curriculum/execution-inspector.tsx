"use client";
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
export function ExecutionInspector({frame,previous,code}:{frame?:ExecutionFrame;previous?:ExecutionFrame;code:string}){
 if(!frame)return <div className="step-story step-story-empty"><strong>Follow the code, step by step</strong><p>Run the solution to see each decision and the variables it changes.</p></div>;
 const changes=Object.entries(frame.vars).filter(([k,v])=>k!=='data'&&k!=='input'&&display(v)!==display(previous?.vars[k])).slice(0,8);
 const title=frame.event==='input'?'Start with this input':frame.event==='error'?'Execution stopped here':frame.event==='complete'?'This execution returned':frame.event==='line'?`Before line ${frame.line}`:`Checkpoint after line ${frame.line}`;
 return <section className="step-story" aria-label="Current step explanation" tabIndex={0}><div className="step-transition" key={JSON.stringify(frame)}><strong>{title}</strong>{frame.line>0&&<code>{code.split('\n')[frame.line-1]}</code>}<p>{previous?'Changes since the previous captured state:':'Initial values:'}</p>{changes.length?<dl>{changes.map(([name,value])=><div key={name}><dt>{name}</dt><dd><span>{previous&&name in previous.vars?display(previous.vars[name]):'not yet recorded'}</span><b> → </b><strong>{display(value)}</strong></dd></div>)}</dl>:<p>No recorded value changed. The code may be testing a condition or moving to another statement.</p>}</div></section>;
}

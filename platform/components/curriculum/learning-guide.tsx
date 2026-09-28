"use client";
import {useState} from 'react';
import type {Problem} from '@/lib/curriculum/catalog';
import {examplesFor,lessons,foundations} from '@/lib/curriculum/learning';
import type {Example} from '@/lib/curriculum/learning-types';

export function LearningGuide({problem:p,running,onPlay,selected,onSelect}:{problem:Problem;running:boolean;onPlay:(example:Example)=>void;selected:number;onSelect:(index:number)=>void}){
 const [revealed,setRevealed]=useState(false);
 const guide=lessons[p.id],examples=examplesFor(p),example=examples[Math.max(0,selected)];
 return <section className="learning-guide" aria-labelledby="understand-heading">
  <div className="lesson-intro"><div className="eyebrow mint">UNDERSTAND → PREDICT → PLAY</div><h2 id="understand-heading">Understand the idea</h2><p>{guide.idea}</p></div>
  <div className="lesson-explanation"><div><h3>How to think about it</h3><ol>{guide.steps.map((step,i)=><li key={i}>{step}</li>)}</ol></div><details className="lesson-foundations"><summary>New to these terms?</summary><p>{foundations[p.scene]}</p><p><strong>Reading the input:</strong> square brackets list values in order; curly braces name the inputs. true / false mean yes / no. An empty list is []; an empty string is "". The returned answer may be a value, a list, or a true/false decision.</p></details></div>
  <details className="lesson-advanced"><summary>Go deeper: why it works &amp; efficiency</summary><div><h3>Why these decisions are safe</h3><p>{guide.why}</p><h3>Time and memory</h3><p>{guide.cost}</p><p className="lesson-footnote">These costs describe the approach above, excluding visualization snapshots and input/output conversion. O(n) means work grows roughly with the input size; O(log n) means repeatedly halving the work; O(n²) means roughly all pairs. Extra space is memory beyond the input and returned answer. An invariant is a rule kept true after every step.</p></div></details>
  <div className="lesson-examples"><h3>Explore five different cases</h3><p>Predict the answer and explain your reasoning. Then reveal the walkthrough or play the code to check it.</p>
   <div className="example-options" role="group" aria-label="Choose an explained example">{examples.map((x,i)=><button key={x.label} disabled={running} aria-pressed={i===selected} onClick={()=>{onSelect(i);setRevealed(false);}}><span>0{i+1}</span>{x.label}</button>)}</div>
   <div className="example-detail" aria-live="polite"><div className="example-input"><h4>{example.label}</h4><pre>{JSON.stringify(example.input,null,2)}</pre><button className="run-code" disabled={running} onClick={()=>onPlay(example)}>{running?'Preparing playback…':'Load example & play'}</button><small>Loads this input and runs your current code. Your code edits are kept.</small></div><div className="example-reasoning"><h4>Before you press Play</h4><p>What should this input return, and which decision makes it different from the other examples?</p><button className="reveal-answer" aria-expanded={revealed} onClick={()=>setRevealed(!revealed)}>{revealed?'Hide explanation':'Reveal answer & explanation'}</button>{revealed&&<div><p className="expected-label">Expected answer</p><pre>{JSON.stringify(example.expected,null,2)}</pre><ol>{example.walkthrough.map((step,i)=><li key={i}>{step}</li>)}</ol><p className="lesson-footnote">During playback, pause at a changed value. Explain why it changed before taking the next step. Can you change one input value and predict how the answer changes?</p></div>}</div></div>
  </div>
 </section>;
}

"use client";
import { useMemo } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, ArrowUpRight, Play, Pause, RotateCcw, SkipForward, Code2, MousePointer2, GitCompareArrows } from "lucide-react";
import { lessons, lessonInputs, type Lesson } from "@/lib/lessons";
import { runCode } from "@/lib/trace/interpreter";
import { usePlayback } from "./use-playback";
import { MotionStage } from "./motion-stage";
import { LessonPreview } from "./lesson-preview";
export function Overview({onLesson,onLibrary,lastLesson,completed}: {onLesson:(l:Lesson)=>void;onLibrary:()=>void;lastLesson:string;completed:number}) {
  const lesson=lessons[0], run=useMemo(()=>runCode(lesson.code,lessonInputs(lesson,lesson.input,lesson.target)),[lesson]);
  const playback=usePlayback(run.frames.length,1.5), reduced=useReducedMotion();
  return <motion.div className="overview" initial={{opacity:0,y:reduced?0:12}} animate={{opacity:1,y:0}} transition={{duration:.35}}>
    <div className="overview-intro"><div className="eyebrow mint"><span className="chapter-line"/> THE ALGORITHM, UNFOLDED</div><div className="overview-heading"><h1>Understand<br/>every <em>move.</em></h1><div><p>Make the abstract click. Follow real code, move through its decisions, and build an intuition that stays.</p><button className="button overview-cta" onClick={()=>onLesson(lessons.find(l=>l.id===lastLesson)??lesson)}>Continue learning<ArrowRight size={17}/></button></div></div></div>
    <div className="overview-demo panel"><div className="demo-heading"><div><span className="eyebrow">01 / TWO POINTERS</span><h2>Two ends. One answer.</h2><p>Find two numbers that add up to <strong>25</strong>.</p></div><div className="demo-transport"><button className="icon-button" onClick={()=>playback.seek(0)} aria-label="Reset demo"><RotateCcw size={17}/></button><button className="button" onClick={()=>playback.setPlaying(p=>!p)} aria-label={playback.playing?"Pause demo":"Play demo"}>{playback.playing?<Pause size={16}/>:<Play size={16}/>} {playback.playing?"Pause":"Play the idea"}</button><button className="icon-button" onClick={()=>playback.move(playback.step+1)} aria-label="Next demo step" disabled={playback.step===run.frames.length-1}><SkipForward size={17}/></button></div></div><MotionStage frame={run.frames[playback.step]} nextFrame={run.frames[playback.target]} phase={playback.phase} lesson={lesson} compact/><div className="demo-foot"><span><MousePointer2 size={14}/> A real execution. Try it.</span><button className="text-button" onClick={()=>onLesson(lesson)}>Open in the studio<ArrowUpRight size={15}/></button></div></div>
    <div className="overview-section-title"><div><span className="eyebrow">BUILD YOUR FOUNDATIONS</span><h2>Small ideas. Powerful patterns.</h2></div><button className="text-button" onClick={onLibrary}>All six lessons<ArrowRight size={16}/></button></div>
    <div className="overview-lessons">{lessons.slice(1,4).map(l=><button className="overview-lesson" key={l.id} onClick={()=>onLesson(l)}><LessonPreview lesson={l}/><div><span>{l.category}</span><h3>{l.title}<ArrowUpRight size={17}/></h3><p>{l.duration} · {l.complexity}</p></div></button>)}</div>
    <div className="overview-note"><Code2 size={20}/><p>Change the code. Follow the state. <span>Every step comes from execution.</span></p><span>{completed} / 6 lessons completed</span></div>
  </motion.div>;
}

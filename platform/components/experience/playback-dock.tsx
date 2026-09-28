"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Play, Pause, SkipBack, SkipForward, RotateCcw } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSidebar } from "@/components/ui/sidebar";
import type { usePlayback } from "./use-playback";
export function PlaybackDock({ playback,count,speed,setSpeed,running,onSeek }: {playback:ReturnType<typeof usePlayback>;count:number;speed:string;setSpeed:(v:string)=>void;running:boolean;onSeek:(v:number)=>void}) {
 const {open,isMobile}=useSidebar();const moving=playback.playing||playback.active;
 const [mounted,setMounted]=useState(false);
 useEffect(()=>setMounted(true),[]);
 if(!mounted)return null;
 return createPortal(<div className="floating-playback" aria-label="Playback controls" style={{left:isMobile?16:open?270:32,right:isMobile?16:32}}>
   <div className="dock-transport"><button className="icon-button" onClick={()=>onSeek(0)} aria-label="Reset playback" disabled={running||(playback.step===0&&playback.target===0)}><RotateCcw size={16}/></button><button className="icon-button" aria-label="Previous step" disabled={running||playback.step===0} onClick={()=>playback.move(playback.step-1)}><SkipBack size={17}/></button><button className="dock-play" aria-label={moving?"Pause":"Play"} disabled={running} onClick={()=>playback.setPlaying(!moving)}>{moving?<Pause size={18}/>:<Play size={18}/>}<span>{moving?"Pause":"Play"}</span></button><button className="icon-button" aria-label="Next step" disabled={running||playback.step>=count-1} onClick={()=>playback.move(playback.step+1)}><SkipForward size={17}/></button></div>
   <div className="dock-timeline"><div><span>EXECUTION</span><span><b>{playback.step}</b> / {count-1}</span></div><Slider aria-label="Execution step" min={0} max={Math.max(1,count-1)} step={1} value={[playback.step]} disabled={running} onValueChange={([n])=>onSeek(n)}/></div>
   <Select value={speed} onValueChange={setSpeed}><SelectTrigger aria-label="Playback speed" className="dock-speed"><SelectValue/></SelectTrigger><SelectContent>{["0.5","1","1.5","2","4"].map(v=><SelectItem value={v} key={v}>{v}× speed</SelectItem>)}</SelectContent></Select>
 </div>,document.body);
}

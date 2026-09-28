export interface PlaybackFrame {
 line:number; event:string; function:string;
 vars:Record<string,unknown>; stack:{name:string;line:number}[];
}
export interface PlaybackRun {
 frames:PlaybackFrame[];result:unknown;error?:string|null;errorLine?:number;stdout?:string;truncated?:boolean;
}
/** Boundary states describe actual input/output, never invented intermediate execution. */
export function withExecutionBoundaries(run:PlaybackRun,input:Record<string,unknown>):PlaybackRun {
 const frames=run.frames.filter(f=>f.event!=="input"&&f.event!=="complete");
 const initial:PlaybackFrame={line:0,event:"input",function:"solve",vars:{...input},stack:[]};
 const final:PlaybackFrame={line:run.error?(run.errorLine??frames.at(-1)?.line??0):0,event:run.error?"error":"complete",function:"solve",vars:{...(frames.at(-1)?.vars??input),answer:run.result,...(run.error?{error:run.error}:{})},stack:[]};
 return {...run,frames:[initial,...frames,final]};
}
export function needsExecution(run:PlaybackRun|null,stale:boolean){return !run||!run.frames.length||stale;}

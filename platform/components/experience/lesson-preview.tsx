"use client";
import type { Lesson } from "@/lib/lessons";
export function LessonPreview({lesson}: {lesson:Lesson}) {
  const id=lesson.id;
  return <div className={`lesson-preview preview-${id}`} aria-hidden="true">
    <div className="preview-top"><span>{id==="prefix-sum"?"CUMULATIVE TOTALS":id==="binary-search"?"DIVIDE & FIND":id==="sliding-window"?"REUSE THE WORK":id==="two-sum"?"MEET IN THE MIDDLE":"ORDER FROM CHAOS"}</span><span>0{["two-sum","binary-search","sliding-window","bubble-sort","insertion-sort","prefix-sum"].indexOf(id)+1}</span></div>
    <div className="preview-values">{[2,4,7,9,11,14].map((v,i)=><span key={i} style={lesson.category==="Sorting"?{height:24+[34,8,52,18,42,26][i]}:undefined}>{lesson.category==="Sorting"?"":v}</span>)}
      {id==="two-sum"&&<><i className="preview-pointer p-left">L↓</i><i className="preview-pointer p-right">R↓</i></>}
      {id==="binary-search"&&<i className="preview-search"/>}
      {id==="sliding-window"&&<i className="preview-window"/>}
    </div>
    {id==="prefix-sum"&&<div className="preview-prefix">{[0,2,6,13,22,33,47].map(v=><span key={v}>{v}</span>)}</div>}
    {id==="insertion-sort"&&<span className="preview-key">key = 4</span>}
  </div>;
}

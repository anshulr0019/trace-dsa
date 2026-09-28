import {parser} from '@lezer/java';
/** CheerpJ omits line tables from stack traces. Preserve original checkpoint lines. */
export function instrumentJava(code:string):string {
  const edits:{from:number;to:number;text:string}[]=[];
  parser.parse(code).iterate({enter(node){
    if(node.name!=='MethodInvocation')return;
    const method=node.node.getChild('MethodName'),args=node.node.getChild('ArgumentList');
    if(!method||!args||code.slice(method.from,method.to)!=='trace')return;
    const prefix=code.slice(node.from,method.from).trim();
    if(prefix&&prefix!=='Trace.'&&prefix!=='Solution.'&&prefix!=='this.')return;
    const line=code.slice(0,method.from).split('\n').length;
    edits.push({from:method.from,to:method.to,text:'traceAt'},{from:args.from+1,to:args.from+1,text:`${line}${code.slice(args.from+1,args.to-1).trim()?',':''}`});
  }});
  for(const edit of edits.sort((a,b)=>b.from-a.from))code=code.slice(0,edit.from)+edit.text+code.slice(edit.to);
  return code;
}

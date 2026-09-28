import {parser as cppParser} from "@lezer/cpp";
import type {SyntaxNode} from "@lezer/common";
const children=(node:SyntaxNode)=>{const out:SyntaxNode[]=[];for(let c=node.firstChild;c;c=c.nextSibling)out.push(c);return out;};
export function instrumentCpp(code:string):string{
 const tree=cppParser.parse(code),edits:{at:number;text:string}[]=[];
 const text=(n:SyntaxNode)=>code.slice(n.from,n.to);
 const line=(n:SyntaxNode)=>code.slice(0,n.from).split('\n').length;
 const namesIn=(n:SyntaxNode):string[]=>{
  const names:string[]=[];
  const walk=(x:SyntaxNode)=>{
   if(x.name==='InitDeclarator'){const id=x.firstChild;if(id?.name==='Identifier')names.push(text(id));return;}
   if(x.name==='ParameterDeclaration'){const id=children(x).find(y=>y.name==='Identifier');if(id)names.push(text(id));return;}
   for(const c of children(x))walk(c);
  };walk(n);return names;
 };
 const probe=(n:SyntaxNode,names:string[])=>`\n#line ${line(n)} "solution.cpp"\n__trace_auto(${line(n)},__func__,[&](json& __trace_state){${[...new Set(names)].filter(x=>/^[a-zA-Z_]\w*$/.test(x)&&!x.startsWith('__trace')).map(x=>`__trace_put(__trace_state,${JSON.stringify(x)},${x});`).join('')}});\n#line ${line(n)} "solution.cpp"\n`;
 const visit=(node:SyntaxNode,scope:string[],functionBody=false)=>{
  if(node.name==='FunctionDefinition'){
   const decl=children(node).find(n=>n.name==='FunctionDeclarator');
   const body=children(node).find(n=>n.name==='CompoundStatement');
   if(body)visit(body,decl?namesIn(decl):[],true);return;
  }
  if(node.name==='CompoundStatement'){
   const local=[...scope];
   if(node.firstChild)edits.push({at:node.firstChild.to,text:(functionBody?'\n__trace_call __trace_scope(__func__);\n':'')+probe(node,local)});
   for(const c of children(node)){
    if(c.name==='{'||c.name==='}')continue;
    edits.push({at:c.from,text:probe(c,local)});visit(c,local);
    if(c.name==='Declaration')local.push(...namesIn(c));
   }
   if(functionBody&&node.lastChild)edits.push({at:node.lastChild.from,text:probe(node.lastChild,local)});
   return;
  }
  if(['ForStatement','ForInStatement','ForRangeLoop','WhileStatement','DoStatement','IfStatement'].includes(node.name)){
   const parts=children(node);const declaration=parts.find(c=>c.name==='Declaration');
   const rangeVariable=node.name==='ForRangeLoop'?parts.find(c=>c.name==='Identifier'):undefined;
   const local=[...scope,...(declaration?namesIn(declaration):[]),...(rangeVariable?[text(rangeVariable)]:[])];
   for(const part of parts.filter(c=>c.name.endsWith('Statement'))){
    if(part.name==='CompoundStatement')visit(part,local);
    else{edits.push({at:part.from,text:'{'+probe(part,local)});visit(part,local);edits.push({at:part.to,text:'}'});}
   }return;
  }
  // Lambda bodies carry their outer lexical variables and their own parameters.
  for(const c of children(node)){
   if(c.name==='LambdaExpression'){
    const params=children(c).find(x=>x.name==='ParameterList');const body=children(c).find(x=>x.name==='CompoundStatement');
    // Do not introduce captures that the student's lambda did not declare.
    if(body)visit(body,params?namesIn(params):[]);
   }else if(c.name!=='CompoundStatement')visit(c,scope);
  }
 };
 visit(tree.topNode,[]);
 let output=code;for(const edit of edits.sort((a,b)=>b.at-a.at))output=output.slice(0,edit.at)+edit.text+output.slice(edit.at);
 return output;
}

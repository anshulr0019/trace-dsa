import {createRequire} from 'node:module';
import {parser as cppParser} from '@lezer/cpp';
import type {SyntaxNode} from '@lezer/common';
const require=createRequire(import.meta.url);
const babel=require('@babel/core');

/** Insert observation calls; the student's statements still execute in the native runtime. */
export function instrumentJavascript(code:string):string{
 return babel.transformSync(code,{configFile:false,babelrc:false,filename:'solution.js',retainLines:true,plugins:[function(){return {visitor:{
  Statement:{exit(path:any){
   if(!path.node.loc||path.isBlockStatement()||path.isEmptyStatement()||path.isFunctionDeclaration()||path.isClassDeclaration()||path.isImportDeclaration()||path.isExportDeclaration())return;
   if(path.parentPath.isForStatement()&&(path.key==='init'||path.key==='update'))return;
   if((path.parentPath.isForInStatement()||path.parentPath.isForOfStatement())&&path.key==='left')return;
   if(path.parentPath.isLabeledStatement())return;
   const names=Object.keys(path.scope.getAllBindings()).filter(k=>!k.startsWith('__trace'));
   const snapshot=names.map(k=>`${JSON.stringify(k)}:()=>${k}`).join(',');
   const fn=path.getFunctionParent();const functionName=fn?.node?.id?.name??(fn?.parentPath?.isVariableDeclarator()?fn.parentPath.node.id.name:'solve');
   const probe=babel.template.statement.ast(`__traceAuto(${path.node.loc.start.line},{${snapshot}},${JSON.stringify(functionName)});`);
   if(path.inList)path.insertBefore(probe);
   else if(['body','consequent','alternate'].includes(String(path.key)))path.replaceWith(babel.types.blockStatement([probe,path.node]));
  }}
 }}}]}).code;
}

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

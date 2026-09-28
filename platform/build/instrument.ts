import {createRequire} from 'node:module';
export {instrumentCpp} from "../lib/curriculum/instrument-cpp";
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

import {rawSources} from "../lib/curriculum/playground";
import {format} from "prettier";
import {spawnSync} from "node:child_process";
import {writeFileSync} from "node:fs";
const output:Record<string,Record<string,string>>={cpp:{},javascript:{}};
for(const [language,sources]of Object.entries(rawSources))for(const [id,source]of Object.entries(sources)){
  if(language==="javascript")output[language][id]=await format(source,{parser:"babel",tabWidth:4,printWidth:90});
  else {
    const result=spawnSync("./node_modules/.bin/clang-format",["-style={BasedOnStyle: LLVM, IndentWidth: 4, ColumnLimit: 90}"],{input:source,encoding:"utf8"});
    if(result.status!==0)throw Error(result.stderr||String(result.error));
    output[language][id]=result.stdout;
  }
}
writeFileSync("lib/curriculum/formatted-sources.json",JSON.stringify(output,null,2)+"\n");
console.log(`Formatted ${Object.values(output).reduce((n,bank)=>n+Object.keys(bank).length,0)} solutions.`);

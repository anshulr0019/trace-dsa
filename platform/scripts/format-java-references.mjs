import {writeFile} from 'node:fs/promises';
import {format} from 'prettier';
import * as linear from './java-reference-bodies.mjs';
import * as search from './java-reference-search.mjs';
import * as graphs from './java-reference-graphs.mjs';
import * as dp from './java-reference-dp.mjs';
const bodies={...linear.bodies,...search.bodies,...graphs.bodies,...dp.bodies};
const helpers={...linear.helpers,...search.helpers,...graphs.helpers,...dp.helpers};
const markers={links:'makeLinks(',tree:'new Tree(',trie:'new Trie(',flood:'flood(',directions:'DIRECTIONS',topological:'topological(',union:'new UnionFind(',prefix:'prefix('};
const result={};
for(const [id,body] of Object.entries(bodies)){
 const support=Object.entries(markers).filter(([,marker])=>body.includes(marker)).map(([key])=>helpers[key]).join('\n');
 result[id]=await format(`import java.util.*;\n\n// Input helpers and trace(name, value, ...) are provided by Trace.\npublic class Solution extends Trace {\npublic Object solve(Map<String,Object> data) {${body}}\n${support}\n}`,{parser:'java',plugins:['prettier-plugin-java'],tabWidth:4,printWidth:90});
}
await writeFile(new URL('../lib/curriculum/java-sources.json',import.meta.url),JSON.stringify(result,null,2)+'\n');
console.log(`Formatted ${Object.keys(result).length} Java references.`);

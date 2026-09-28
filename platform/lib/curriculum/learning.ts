import type {Problem} from './catalog';
import {linearLessons} from './learning-linear';
import {searchLessons} from './learning-search';
import {graphLessons} from './learning-graphs';
import {advancedLessons} from './learning-advanced';
import type {Example} from './learning-types';
import {extraExamples} from './extra-examples';
export const lessons={...linearLessons,...searchLessons,...graphLessons,...advancedLessons};
export function examplesFor(p:Problem):Example[]{const lesson=lessons[p.id];return [{label:'Original example',input:p.input,expected:p.expected,walkthrough:lesson.original},...lesson.examples,...extraExamples[p.id]];}
const canonical=(v:unknown):string=>JSON.stringify(v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b)).map(([k,x])=>[k,JSON.parse(canonical(x))])):Array.isArray(v)?v.map(x=>JSON.parse(canonical(x))):v);
export const sameInput=(a:unknown,b:unknown)=>canonical(a)===canonical(b);
export function matchesAnswer(p:Problem,input:Record<string,unknown>,expected:unknown,actual:unknown):boolean{
 if(sameInput(expected,actual))return true;
 if(p.id==='two-sum-sorted'&&Array.isArray(actual)&&actual.length===2){const [a,b]=actual;const nums=input.nums as number[];return Number.isInteger(a)&&Number.isInteger(b)&&a>=1&&b>a&&b<=nums.length&&nums[a-1]+nums[b-1]===input.target;}
 if(p.id==='binary-search-standard'&&Number.isInteger(actual)&&Number(actual)>=0){const nums=input.nums as number[];return Number(actual)<nums.length&&nums[Number(actual)]===input.target;}
 if(p.id==='gas-station'&&Number.isInteger(actual)&&Number(actual)>=0){const gas=input.gas as number[],cost=input.cost as number[];if(Number(actual)>=gas.length)return false;let tank=0;for(let step=0;step<gas.length;step++){const i=(Number(actual)+step)%gas.length;tank+=gas[i]-cost[i];if(tank<0)return false;}return true;}
 if(p.id==='minimum-window'&&typeof actual==='string'&&typeof expected==='string'&&actual.length===expected.length&&(input.s as string).includes(actual)){const counts=new Map<string,number>();for(const c of actual)counts.set(c,(counts.get(c)??0)+1);for(const c of input.t as string){counts.set(c,(counts.get(c)??0)-1);if(counts.get(c)!<0)return false;}return true;}
 if(typeof actual==='number'&&typeof expected==='number')return Number.isFinite(actual)&&Math.abs(actual-expected)<=1e-9*Math.max(1,Math.abs(expected));
 if(['three-sum','subsets','combination-sum','n-queens','phone-letters','word-search-ii','repeated-dna','accounts-merge','pacific-atlantic','disappeared-numbers'].includes(p.id)&&Array.isArray(actual)&&Array.isArray(expected)){
  const normalize=(v:unknown)=>canonical(Array.isArray(v)&&['three-sum','subsets','combination-sum'].includes(p.id)?[...v].sort((a,b)=>Number(a)-Number(b)):v);
  return sameInput(actual.map(normalize).sort(),expected.map(normalize).sort());
 }
 if(p.id==='course-order'&&Array.isArray(actual)&&Array.isArray(expected)&&expected.length){
  const n=Number(input.numCourses);return actual.length===n&&new Set(actual).size===n&&actual.every(x=>Number.isInteger(x)&&x>=0&&x<n)&&(input.prerequisites as number[][]).every(([after,before])=>actual.indexOf(before)<actual.indexOf(after));
 }
 if(p.id==='alien-dictionary'&&typeof actual==='string'&&expected!==''){
  const words=input.words as string[],letters=new Set(words.join(''));
  if(actual.length!==letters.size||new Set(actual).size!==letters.size||[...actual].some(x=>!letters.has(x)))return false;
  return words.slice(1).every((b,i)=>{const a=words[i];let j=0;while(j<Math.min(a.length,b.length)&&a[j]===b[j])j++;return j===Math.min(a.length,b.length)?a.length<=b.length:actual.indexOf(a[j])<actual.indexOf(b[j]);});
 }
 if(p.id==='build-matrix'&&Array.isArray(expected)&&expected.length&&Array.isArray(actual)){
  const k=Number(input.k),positions=new Map<number,number[]>();
  if(actual.length!==k||actual.some(row=>!Array.isArray(row)||row.length!==k))return false;
  for(let r=0;r<k;r++)for(let c=0;c<k;c++){const v=actual[r][c];if(v===0)continue;if(!Number.isInteger(v)||v<1||v>k||positions.has(v))return false;positions.set(v,[r,c]);}
  return positions.size===k&&(['rowConditions','colConditions'] as const).every((key,axis)=>(input[key] as number[][]).every(([a,b])=>positions.get(a)![axis]<positions.get(b)![axis]));
 }
 if(p.id==='top-k-frequent'&&Array.isArray(actual)){
  const counts=new Map<number,number>();for(const x of input.nums as number[])counts.set(x,(counts.get(x)??0)+1);
  const threshold=[...counts.values()].sort((a,b)=>b-a)[Number(input.k)-1];
  return actual.length===Number(input.k)&&new Set(actual).size===actual.length&&actual.every(x=>(counts.get(x)??0)>=threshold)&&Math.min(...actual.map(x=>counts.get(x)??0))>=Math.max(0,...[...counts].filter(([x])=>!actual.includes(x)).map(([,n])=>n));
 }
 return false;
}
export const foundations:Record<string,string>={
 array:'An array is an ordered row of values. An index is a position, usually counted from 0. A pointer here often means an index that moves through that row.',
 string:'A string is a sequence of characters. A substring is a continuous piece; a subsequence may skip characters but keeps their order. A prefix starts at the beginning; a suffix ends at the end.',
 linked:'A linked list is a chain of nodes joined by next links. A pointer identifies a node, not its value. Here values lists the node values; positions and random links use zero-based indices. null means no link.',
 stack:'A stack is last-in, first-out, like a pile of plates. Push adds to the top; pop removes the top. A monotonic stack keeps values ordered so a new value can resolve earlier questions.',
 interval:'An interval [start,end] describes a span. Closed intervals include both endpoints. Meeting-room intervals exclude the end, so a room can be reused at exactly that time.',
 tree:'A tree has a root and child links. A leaf has no children; a subtree is a node and everything below it. Here tree uses level order: read children left to right, and use null for a missing child.',
 trie:'A trie is a tree whose edges represent letters. Following a path spells a prefix. A separate end marker records a complete word. Operations run in order; null in the output means a command returns no value.',
 grid:'A grid is a list of rows. Position [r,c] means row r, column c, counting from 0. Neighbors usually share a side; a diagonal move is allowed only if the problem explicitly says so.',
 graph:'A graph contains vertices (items) and edges (connections). Directed edges work one way. BFS uses a first-in, first-out queue; DFS follows one branch before returning. A weight is a cost attached to a connection.',
 heap:'A heap is a structure that quickly exposes its smallest value (min-heap) or largest value (max-heap). It is not fully sorted. Removing the top restores the heap rule before the next lookup.',
 backtrack:'Backtracking means choose, explore, undo. Recursion means a function asks the same function to solve a smaller task. The base case is where a branch finishes without another call.',
 dp:'Dynamic programming saves smaller answers and reuses them. A state says exactly which smaller problem a value answers. A base case is an answer known without further work. A recurrence combines those smaller answers.',
 bits:'A bit is a binary digit: 0 or 1. XOR (^) marks differing bits, AND (&) keeps bits set in both numbers, and a shift moves bits left or right. Fixed-width signed integers use the highest bit as part of a two’s-complement representation.',
};

import {problemById} from "./catalog";
type Input=Record<string,unknown>;
/** Bound learning inputs before allocating tables or following user-supplied links. */
export function validateProblemInput(id:string,input:unknown):string|null {
 const p=problemById[id];if(!p)return "Unknown curriculum problem.";
 if(!input||typeof input!=="object"||Array.isArray(input))return "Input must be a JSON object.";
 const d=input as Input;
 const error=(message:string)=>{throw Error(message);};
 const nums=(key:string):number[]=>{const v=d[key];if(!Array.isArray(v)||v.some(x=>typeof x!=="number"||!Number.isInteger(x)))error(`${key} must be an array of integers.`);return v as number[];};
 const integer=(key:string,min=0,max=10000)=>{const v=d[key];if(typeof v!=="number"||!Number.isInteger(v)||v<min||v>max)error(`${key} must be an integer from ${min} through ${max}.`);return v as number;};
 const positive=(key:string)=>{if(nums(key).some(n=>n<=0))error(`${key} must contain positive values.`);};
 const sorted=(key:string)=>{const a=nums(key);if(a.some((v,i)=>i>0&&v<a[i-1]))error(`${key} must be sorted in ascending order.`);};
 const same=(a:string,b:string)=>{if((d[a] as unknown[]).length!==(d[b] as unknown[]).length)error(`${a} and ${b} must have the same length.`);};
 try {
  let size=0;
  const inspect=(v:unknown,depth=0)=>{
   if(++size>2500||depth>8)error("Use a smaller learning input (at most 2,500 values and 8 levels).");
   if(typeof v==="number"&&(!Number.isFinite(v)||Math.abs(v)>4294967295))error("Numbers must be finite and within 32-bit unsigned magnitude.");
   if(typeof v==="string"&&(v.length>120||/[^\x20-\x7E]/.test(v)))error("Use ASCII strings of at most 120 characters for cross-language lessons.");
   if(Array.isArray(v)){if(v.length>100)error("Use arrays of at most 100 items.");v.forEach(x=>inspect(x,depth+1));}
   else if(v&&typeof v==="object")Object.values(v).forEach(x=>inspect(x,depth+1));
  };inspect(d);
  for(const [key,example]of Object.entries(p.input)){
   const v=d[key];if(v===undefined)error(`Missing input field: ${key}.`);
   if(Array.isArray(example)){if(!Array.isArray(v))error(`${key} must be an array.`);}
   else if(typeof v!==typeof example)error(`${key} must be a ${typeof example}.`);
  }
  for(const key of ["grid","matrix","heights","board"]){
   const v=d[key];if(!Array.isArray(v)||(!Array.isArray(v[0])&&v.length))continue;
   const width=v[0]?.length??0;if(v.some(row=>!Array.isArray(row)||row.length!==width))error(`${key} must be rectangular.`);
   if(v.length>20||width>20)error(`${key} is limited to 20 × 20 for readable visualization.`);
  }
  if(["maximum-average-subarray","kth-largest"].includes(id))integer("k",1,nums("nums").length);
  if(id==="reverse-k-group")integer("k",1,100);
  if(["character-replacement"].includes(id))integer("k",0,120);
  if(["two-sum-sorted","binary-search-standard"].includes(id))sorted("nums");
  if(id==="median-sorted-arrays"){sorted("nums1");sorted("nums2");if(!nums("nums1").length&&!nums("nums2").length)error("At least one array must be nonempty.");}
  if(["minimum-rotated","mountain-array"].includes(id)&&!nums("nums").length)error("nums must be nonempty.");
  if(id==="mountain-array"){const a=nums("nums"),peak=a.indexOf(Math.max(...a));if(peak===0||peak===a.length-1||a.some((v,i)=>i>0&&(i<=peak?v<=a[i-1]:v>=a[i-1])))error("nums must rise strictly to one interior peak, then fall strictly.");}
  if(id==="koko-bananas"){positive("piles");if(!nums("piles").length)error("piles must be nonempty.");integer("h",nums("piles").length,10000);}
  if(id==="duplicate-number"){const a=nums("nums");if(a.length<2||a.some(v=>v<1||v>=a.length)||new Set(a).size!==a.length-1)error("Use n+1 values in 1…n with exactly one duplicated value.");}
  if(["linked-cycle","cycle-entrance","middle-list"].includes(id))integer("pos",-1,nums("values").length-1);
  if(id==="copy-random-list"){same("values","random");if((d.random as unknown[]).some(x=>x!==null&&(typeof x!=="number"||!Number.isInteger(x)||x<0||x>=(d.values as unknown[]).length)))error("random entries must be null or valid node indices.");}
  if(id==="car-fleet"){positive("speed");same("position","speed");const target=integer("target",1);if(nums("position").some(v=>v<0||v>=target))error("Each position must be before the target.");}
  if(id==="gas-station")same("gas","cost");
  if(["missing-number","disappeared-numbers","set-mismatch"].includes(id)){const a=nums("nums"),lo=id==="missing-number"?0:1;if(a.some(v=>v<lo||v>a.length))error(`nums values must be in ${lo}…${a.length}.`);if(id==="missing-number"&&new Set(a).size!==a.length)error("Missing Number requires unique input values.");if(id==="set-mismatch"&&(a.length<2||new Set(a).size!==a.length-1))error("Set Mismatch requires one duplicated and one missing value.");}
  if(id==="n-queens")integer("n",1,7);
  if(id==="climbing-stairs")integer("n",0,50);
  if(id==="counting-bits")integer("n",0,100);
  if(id==="reverse-bits")integer("n",0,4294967295);
  if(id==="sum-two-integers"){integer("a",-2147483648,2147483647);integer("b",-2147483648,2147483647);}
  if(id==="subsets"&&nums("nums").length>8)error("Use at most 8 elements for the subset decision tree.");
  if(id==="combination-sum"){positive("candidates");integer("target",0,40);}
  if(id==="coin-change"){positive("coins");integer("amount",0,100);}
  if(id==="phone-letters"&&!/^[2-9]{0,5}$/.test(d.digits as string))error("Use at most 5 digits, each from 2 to 9.");
  if(id==="decode-ways"&&!/^\d*$/.test(d.s as string))error("s must contain only digits.");
  if(id==="repeated-dna"&&!/^[ACGT]*$/.test(d.s as string))error("DNA may contain only A, C, G and T.");
  if(id==="regex-matching"&&/(^\*|\*\*)/.test(d.p as string))error("A star must follow a character or dot and cannot follow another star.");
  if(id==="word-ladder"){const n=(d.beginWord as string).length;if((d.endWord as string).length!==n||(d.wordList as string[]).some(w=>typeof w!=="string"||w.length!==n))error("All words must have the same length.");}
  if(["unique-paths","islands-ii"].includes(id)){integer("m",1,20);integer("n",1,20);}
  if(id==="islands-ii"&&(d.positions as number[][]).some(v=>v.length!==2||v[0]<0||v[1]<0||v[0]>=Number(d.m)||v[1]>=Number(d.n)))error("Every position must be inside the grid.");
  if(id==="swim-water"&&(!(d.grid as unknown[][]).length||!(d.grid as unknown[][])[0].length))error("grid must be nonempty.");
  if(["connected-components","network-delay","maximum-probability","cheapest-flights"].includes(id))integer("n",1,30);
  if(["course-schedule","course-order"].includes(id))integer("numCourses",0,30);
  if(id==="build-matrix")integer("k",1,15);
  const count=Number(d.numCourses??d.n??(id==="build-matrix"?d.k:0));
  if(count&&id!=="islands-ii")for(const key of ["edges","times","flights","prerequisites","rowConditions","colConditions"]){if(!Array.isArray(d[key]))continue;const lo=key==="times"||key.endsWith("Conditions")?1:0,hi=count-1+lo;for(const edge of d[key] as unknown[][]){if(!Array.isArray(edge)||edge.length<2||edge.slice(0,2).some(v=>typeof v!=="number"||!Number.isInteger(v)||v<lo||v>hi))error(`${key} endpoints must be in ${lo}…${hi}.`);if(edge.length>2&&(typeof edge[2]!=="number"||edge[2]<0))error("Edge weights must be nonnegative.");}}
  if(id==="maximum-probability"){same("edges","succProb");integer("start",0,count-1);integer("end",0,count-1);if((d.succProb as number[]).some(v=>typeof v!=="number"||v<0||v>1))error("Probabilities must be from 0 to 1.");}
  if(id==="network-delay")integer("k",1,count);
  if(id==="cheapest-flights"){integer("src",0,count-1);integer("dst",0,count-1);integer("k",0,30);}
  if(id==="task-scheduler")integer("n",0,30);
  return null;
 }catch(e){return e instanceof Error?e.message:"Invalid input.";}
}

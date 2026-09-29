import type {ExecutionFrame} from '../../components/curriculum/scene';
export type ConceptCue = {text:string; equation?:string; marks:Record<number,string>};
export function conceptCue(id:string,frame:ExecutionFrame|undefined,previous:ExecutionFrame|undefined,input:Record<string,unknown>,source:string):ConceptCue|undefined {
 if(!frame||['input','error','complete','return'].includes(frame.event))return;
 const v=frame.vars,old=previous?.vars??{},nums=v.nums??input.nums;
 if(!Array.isArray(nums)||!nums.every(n=>typeof n==='number'&&Number.isFinite(n)))return;
 const index=(n:unknown):n is number=>typeof n==='number'&&Number.isInteger(n)&&n>=0&&n<nums.length;
 const checkpoint=frame.event!=='line';
 if(id==='maximum-average-subarray'){
  const k=v.k??input.k,r=v.right;
  if(typeof k!=='number'||!Number.isInteger(k)||k<1||!index(r)||r<k)return;
  const out=r-k, before=nums.slice(out,r).reduce((a,b)=>a+b,0),after=before-nums[out]+nums[r];
  const expression=source.replace(/\s+/g,'');
  const subtractsOutgoing=expression.includes('total+=nums[right]-nums[right-k]')||v.left===out&&expression.includes('total+=nums[right]-nums[left]');
  const upcoming=frame.event==='line'&&subtractsOutgoing&&v.total===before;
  const changed=v.total===after&&old.total===before&&v.total!==old.total;
  if(upcoming||changed||checkpoint&&v.total===after)return {text:`${upcoming?'Next: remove':'Window update: remove'} ${nums[out]} at index ${out} and add ${nums[r]} at index ${r}. Reuse the previous sum instead of adding all ${k} values again.`,equation:`${before} − (${nums[out]}) + (${nums[r]}) = ${after}`,marks:{[out]:'leaves',[r]:'enters'}};
 }
 if(id==='two-sum-sorted'&&index(v.left)&&index(v.right)&&v.left<v.right&&nums.every((n,i)=>i===0||nums[i-1]<=n)){
  const target=v.target??input.target,sum=nums[v.left]+nums[v.right];
  if(typeof target!=='number'||(!checkpoint&&!/total\s*[<>=]|nums\[left\].*nums\[right\]/.test(source)))return;
  if(v.total!==undefined&&v.total!==sum)return;
  return {text:sum===target?'These two values match the target. The answer uses one-based positions.':sum<target?'The sum is too small. In a sorted array, moving left one place right can increase it.':'The sum is too large. In a sorted array, moving right one place left can decrease it.',equation:`${nums[v.left]} + ${nums[v.right]} = ${sum} ${sum===target?'=':sum<target?'<':'>'} ${target}`,marks:{[v.left]:'left value',[v.right]:'right value'}};
 }
 if(id==='binary-search-standard'&&index(v.mid)&&index(v.left)&&index(v.right)&&v.mid>=v.left&&v.mid<=v.right&&nums.every((n,i)=>i===0||nums[i-1]<=n)){
  const target=v.target??input.target,value=nums[v.mid];
  if(typeof target!=='number'||(!checkpoint&&!/nums\[mid\]/.test(source)))return;
  const marks:Record<number,string>={[v.mid]:'compare'};
  if(value!==target)for(let i=v.left;i<=v.right;i++)if(i!==v.mid&&(value<target?i<v.mid:i>v.mid))marks[i]='can skip';
  return {text:value===target?'The middle value matches the target. Its index is the answer.':value<target?'The middle value is too small. Sorted order lets us skip it and everything to its left.':'The middle value is too large. Sorted order lets us skip it and everything to its right.',equation:`${value} ${value===target?'=':value<target?'<':'>'} ${target}`,marks};
 }
}

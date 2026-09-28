import type { Frame } from "./interpreter";
/** Each recorded frame represents exactly one counted reference operation. */
export function comparisonTraces(id:string, input:number[], target:number): [Frame[],Frame[]] {
  const a:Frame[]=[], b:Frame[]=[];
  const record=(out:Frame[],nums:number[],active:number[],message:string,total?:number)=>{
    out.push({line:0,vars:{nums:[...nums],...(active[0]!==undefined?{left:active[0]}:{}),...(active[1]!==undefined?{right:active[1]}:{}),...(total!==undefined?{total}:{})},comparisons:out.length,message,event:{kind:"assign",reads:active.map(index=>({name:"nums",index,value:nums[index]??0}))}});
  };
  record(a,input,[],"Ready to compare.");record(b,input,[],"Ready to compare.");
  const n=input.length;
  if(id==="two-sum") {
    let found=false;
    for(let i=0;i<n&&!found;i++)for(let j=i+1;j<n;j++) {const sum=input[i]+input[j];record(a,input,[i,j],`${input[i]} + ${input[j]} = ${sum}`,sum);if(sum===target){found=true;break;}}
    let l=0,r=n-1;
    while(l<r){const sum=input[l]+input[r];record(b,input,[l,r],`${input[l]} + ${input[r]} = ${sum}`,sum);if(sum===target)break;if(sum<target)l++;else r--;}
  } else if(id==="binary-search") {
    for(let i=0;i<n;i++){record(a,input,[i],`Check ${input[i]} against ${target}.`);if(input[i]===target)break;}
    let l=0,r=n-1;while(l<=r){const m=Math.floor((l+r)/2);record(b,input,[m],`Check midpoint ${input[m]} against ${target}.`);if(input[m]===target)break;if(input[m]<target)l=m+1;else r=m-1;}
  } else if(id==="sliding-window") {
    for(let l=0;l<=n-target;l++){let total=0;for(let j=l;j<l+target;j++){total+=input[j];record(a,input,[j],`Add ${input[j]} to window [${l} … ${l+target-1}].`,total);}}
    let total=0;for(let i=0;i<target;i++){total+=input[i];record(b,input,[i],`Build the first window: add ${input[i]}.`,total);}
    for(let r=target;r<n;r++){total+=input[r];record(b,input,[r],`Add entering value ${input[r]}.`,total);total-=input[r-target];record(b,input,[r-target],`Subtract leaving value ${input[r-target]}.`,total);}
  } else if(id==="prefix-sum") {
    for(let l=0;l<n;l++)for(let r=l;r<n;r++){let total=0;for(let j=l;j<=r;j++){total+=input[j];record(a,input,[j],`Sum range [${l} … ${r}]: add ${input[j]}.`,total);}}
    const prefix=[0];for(let i=0;i<n;i++){prefix.push(prefix[i]+input[i]);record(b,input,[i],`Build prefix[${i+1}] = ${prefix[i+1]}.`,prefix[i+1]);}
    for(let l=0;l<n;l++)for(let r=l;r<n;r++)record(b,input,[l,r],`Query [${l} … ${r}]: ${prefix[r+1]} − ${prefix[l]}.`,prefix[r+1]-prefix[l]);
  } else {
    const bubble=[...input], insert=[...input];
    for(let end=n-1;end>0;end--)for(let j=0;j<end;j++){const x=bubble[j],y=bubble[j+1];if(x>y)[bubble[j],bubble[j+1]]=[y,x];record(a,bubble,[j,j+1],`${x} > ${y}: ${x>y?"swap adjacent values":"keep this order"}.`);}
    for(let i=1;i<n;i++){const key=insert[i];let j=i-1;while(j>=0){const x=insert[j];const shift=x>key;if(shift){insert[j+1]=x;insert[j]=key;}record(b,insert,[j,j+1],`${x} > key ${key}: ${shift?"shift right":"insertion position found"}.`);if(!shift)break;j--;}insert[j+1]=key;}
  }
  return [a,b];
}

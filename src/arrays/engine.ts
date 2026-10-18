import type { Mission, MissionId } from './curriculum';
export type Frame = { values: number[]; active: number[]; message: string; variables: Record<string, number | string>; choices: string[]; correct: number; lookup?: [number, number][] };
export function buildFrames(m: Mission): Frame[] {
  const values = [...m.nums], frames: Frame[] = [];
  const add = (active: number[], message: string, variables: Frame['variables'], choices: string[], correct: number, lookup?: [number,number][]) => frames.push({ values: [...values], active, message, variables, choices, correct, lookup });
  if (m.id === 'patrol') {
    let total = 0;
    values.forEach((n,i) => { add([i], `Visit index ${i}. Add ${n} to the running total ${total}.`, { index: i, total }, [`Add ${n}`, 'Skip this crate'], 0); total += n; });
    add([], `All crates visited. Total = ${total}.`, { total }, [], 0);
  } else if (m.id === 'maximum') {
    let best = values[0];
    add([0], 'Start the record with the first crate, even if it is negative.', { best }, ['Use the first value', 'Always start at zero'], 0);
    values.slice(1).forEach((n,j) => { const i=j+1; add([i], `Compare ${n} with the current maximum ${best}.`, { index: i, current: n, best }, ['Keep the record', 'Update the record'], n>best?1:0); best=Math.max(best,n); });
    add([values.indexOf(best)], `The maximum is ${best}. Every crate has been checked.`, { best }, [], 0);
  } else if (m.id === 'reverse') {
    for(let left=0,right=values.length-1;left<right;left++,right--) {
      add([left,right], `Swap indices ${left} and ${right}, then move inward.`, { left, right }, ['Swap both ends', 'Move only the left pointer'],0);
      [values[left],values[right]]=[values[right],values[left]];
    }
    add([], 'Both pointers have met. The lane is reversed.', { result: `[${values.join(', ')}]` }, [],0);
  } else if (m.id === 'pair') {
    const seen = new Map<number,number>();
    for(let i=0;i<values.length;i++) {
      const need=m.target!-values[i], match=seen.get(need);
      add([i], `Crate ${values[i]} needs ${need}. Is that value on the lookup shelf?`, { index:i, need }, ['Store this crate and continue','Return the matching pair'],match===undefined?0:1,[...seen]);
      if(match!==undefined){add([match,i], `Found indices [${match}, ${i}]. Two different crates, total ${m.target}.`,{target:m.target!},[],0,[...seen]);return frames;}
      seen.set(values[i],i);
    }
    add([], 'No matching pair. Return [].',{},[],0,[...seen]);
  } else {
    let left=0,right=values.length-1;
    while(left<right){const sum=values[left]+values[right]; add([left,right], `The pair sums to ${sum}; the target is ${m.target}.`, { left,right,sum,target:m.target! }, ['Move left inward','Move right inward','Return these positions'],sum===m.target?2:sum<m.target!?0:1);
      if(sum===m.target){add([left,right],`Return one-based positions [${left+1}, ${right+1}].`,{left:left+1,right:right+1},[],0);return frames;}
      if(sum<m.target!)left++;else right--;
    }
    add([], 'The pointers met without a pair. Return [].',{},[],0);
  }
  return frames;
}
export type ArrayCase = { label: string; nums: number[]; target?: number };
export function casesFor(id: MissionId): ArrayCase[] {
  if(id==='pair'||id==='sorted-pair') return [
    {label:'Example',nums:id==='pair'?[3,2,4,7]:[1,3,5,9],target:id==='pair'?6:14},
    {label:'Equal values, distinct indices',nums:[3,3],target:6},
    {label:'Negative values',nums:[-5,-2,1,4],target:-1},
    {label:'No pair',nums:[1,2,4],target:8},
    {label:'Cannot reuse one index',nums:[3],target:6},
    {label:'Empty lane',nums:[],target:0},
    {label:'Fresh challenge',nums:[-9,-4,0,3,8,13],target:9},
  ];
  const common=[{label:'Example',nums:[4,9,2,7,5]},{label:'Single value',nums:[-7]},{label:'All negative',nums:[-8,-3,-6]},{label:'Duplicates',nums:[2,2,2,2]},{label:'Even length',nums:[6,-2,0,9]},{label:'Fresh challenge',nums:[-11,8,3,19,-2,6]}];
  return id==='maximum'?common:[...common,{label:'Empty lane',nums:[]}];
}
export function expected(id: MissionId, c: ArrayCase): number | number[] {
  if(id==='patrol')return c.nums.reduce((a,b)=>a+b,0);
  if(id==='maximum')return Math.max(...c.nums);
  if(id==='reverse')return [...c.nums].reverse();
  for(let i=0;i<c.nums.length;i++)for(let j=i+1;j<c.nums.length;j++)if(c.nums[i]+c.nums[j]===c.target)return id==='pair'?[i,j]:[i+1,j+1];
  return [];
}
export function accepts(id: MissionId,c: ArrayCase,result: unknown,mutated?: unknown): boolean {
  if(id==='pair'||id==='sorted-pair'){
    if(!Array.isArray(result))return false;
    if(!result.length)return (expected(id,c) as number[]).length===0;
    if(result.length!==2||!result.every(Number.isInteger))return false;
    const offset=id==='pair'?0:1,[a,b]=result.map(x=>x-offset);
    return a!==b&&a>=0&&b>=0&&a<c.nums.length&&b<c.nums.length&&c.nums[a]+c.nums[b]===c.target;
  }
  const correct=JSON.stringify(expected(id,c));
  return JSON.stringify(result)===correct&&(id!=='reverse'||JSON.stringify(mutated)===correct);
}

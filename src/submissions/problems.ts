import type { JsonValue, ProblemId } from './contracts';

export type Problem = { id: ProblemId; title: string; method: string; signature: string; input: JsonValue[]; starter: string };
export const problems: Problem[] = [
  { id:'maximum-average',title:'Maximum Average Subarray I',method:'findMaxAverage',signature:'findMaxAverage(self, nums, k)',input:[[1,12,-5,-6,50,3],4],starter:'class Solution:\n    def findMaxAverage(self, nums, k):\n        total = sum(nums[:k])\n        best = total\n        for right in range(k, len(nums)):\n            total -= nums[right - k]\n            total += nums[right]\n            best = max(best, total)\n        return best / k\n' },
  { id:'maximum-vowels',title:'Maximum Number of Vowels',method:'maxVowels',signature:'maxVowels(self, s, k)',input:['abciiidef',3],starter:'class Solution:\n    def maxVowels(self, s, k):\n        count = 0\n        for i in range(k):\n            if s[i] in "aeiou":\n                count += 1\n        best = count\n        for right in range(k, len(s)):\n            if s[right - k] in "aeiou":\n                count -= 1\n            if s[right] in "aeiou":\n                count += 1\n            best = max(best, count)\n        return best\n' },
  { id:'minimum-size',title:'Minimum Size Subarray Sum',method:'minSubArrayLen',signature:'minSubArrayLen(self, target, nums)',input:[7,[2,3,1,2,4,3]],starter:'class Solution:\n    def minSubArrayLen(self, target, nums):\n        left = 0\n        total = 0\n        best = len(nums) + 1\n        for right in range(len(nums)):\n            total += nums[right]\n            while total >= target:\n                best = min(best, right - left + 1)\n                total -= nums[left]\n                left += 1\n        return 0 if best > len(nums) else best\n' },
  { id:'unique-substring',title:'Longest Substring Without Repeating Characters',method:'lengthOfLongestSubstring',signature:'lengthOfLongestSubstring(self, s)',input:['abcabcbb'],starter:'class Solution:\n    def lengthOfLongestSubstring(self, s):\n        seen = set()\n        left = 0\n        best = 0\n        for right in range(len(s)):\n            while s[right] in seen:\n                seen.remove(s[left])\n                left += 1\n            seen.add(s[right])\n            best = max(best, right - left + 1)\n        return best\n' },
  { id:'two-sum',title:'Two Sum II — Input Array Is Sorted',method:'twoSum',signature:'twoSum(self, numbers, target)',input:[[2,7,11,15],9],starter:'class Solution:\n    def twoSum(self, numbers, target):\n        left = 0\n        right = len(numbers) - 1\n        while left < right:\n            total = numbers[left] + numbers[right]\n            if total == target:\n                return [left + 1, right + 1]\n            if total < target:\n                left += 1\n            else:\n                right -= 1\n' },
];
export const bruteAverage = 'class Solution:\n    def findMaxAverage(self, nums, k):\n        best = -10001\n        for start in range(len(nums) - k + 1):\n            total = 0\n            for i in range(start, start + k):\n                total += nums[i]\n            best = max(best, total / k)\n        return best\n';
export const getProblem = (id: ProblemId) => problems.find(p => p.id === id)!;
export function validateInput(id: ProblemId, args: JsonValue[], teaching = true) {
  const max = teaching ? 16 : 100000;
  const numbers = (x:JsonValue) => Array.isArray(x) && x.length>0 && x.length<=max && x.every(n=>typeof n==='number'&&Number.isSafeInteger(n)&&Math.abs(n)<=10000);
  const integer = (x:JsonValue) => typeof x==='number'&&Number.isSafeInteger(x);
  let valid=false;
  if (id==='maximum-average') valid=args.length===2&&numbers(args[0])&&integer(args[1])&&Number(args[1])>=1&&Number(args[1])<=(args[0] as number[]).length;
  if (id==='maximum-vowels') valid=args.length===2&&typeof args[0]==='string'&&/^[a-z]+$/.test(args[0])&&args[0].length<=max&&integer(args[1])&&Number(args[1])>=1&&Number(args[1])<=args[0].length;
  if (id==='minimum-size') valid=args.length===2&&integer(args[0])&&Number(args[0])>0&&Number(args[0])<=1e9&&numbers(args[1])&&(args[1] as number[]).every(n=>n>0);
  if (id==='unique-substring') valid=args.length===1&&typeof args[0]==='string'&&/^[\x20-\x7e]*$/.test(args[0])&&args[0].length<=Math.min(max,50000);
  if (id==='two-sum'&&args.length===2&&numbers(args[0])&&integer(args[1])&&Math.abs(Number(args[1]))<=1000) {
    const nums=args[0] as number[];let matches=0;
    const counts=new Map<number,number>();
    for(const n of nums){matches+=counts.get(Number(args[1])-n)??0;counts.set(n,(counts.get(n)??0)+1);}
    valid=nums.length>=2&&nums.length<=Math.min(max,30000)&&nums.every((n,i)=>Math.abs(n)<=1000&&(i===0||n>=nums[i-1]))&&matches===1;
  }
  if(!valid)throw Error(`Invalid example. Use the documented ${teaching?'16-element teaching':'problem'} domain and argument order.`);
}

// Deliberately independent small-case oracles, not the existing visual adapters.
export function oracle(id:ProblemId,args:JsonValue[]):JsonValue {
  if(id==='maximum-average') {const nums=args[0] as number[],k=args[1] as number;return Math.max(...Array.from({length:nums.length-k+1},(_,i)=>nums.slice(i,i+k).reduce((s,n)=>s+n,0)/k));}
  if(id==='maximum-vowels') {const s=args[0] as string,k=args[1] as number;return Math.max(...Array.from({length:s.length-k+1},(_,i)=>[...s.slice(i,i+k)].filter(c=>'aeiou'.includes(c)).length));}
  if(id==='minimum-size') {const target=args[0] as number,nums=args[1] as number[];let best=Infinity;for(let l=0;l<nums.length;l++){let total=0;for(let r=l;r<nums.length;r++){total+=nums[r];if(total>=target)best=Math.min(best,r-l+1);}}return best===Infinity?0:best;}
  if(id==='unique-substring'){const s=args[0] as string;let best=0;for(let l=0;l<s.length;l++)for(let r=l+1;r<=s.length;r++){const sub=s.slice(l,r);if(new Set(sub).size===sub.length)best=Math.max(best,sub.length);}return best;}
  const nums=args[0] as number[],target=args[1] as number;for(let l=0;l<nums.length;l++)for(let r=l+1;r<nums.length;r++)if(nums[l]+nums[r]===target)return [l+1,r+1];throw Error('No pair');
}
export function equalResult(id:ProblemId,actual:unknown,expected:JsonValue,args:JsonValue[]) {
  if(id==='two-sum') {if(!Array.isArray(actual)||actual.length!==2||!actual.every(Number.isInteger))return false;const [a,b]=actual,nums=args[0] as number[];return a!==b&&a>=1&&b>=1&&a<=nums.length&&b<=nums.length&&nums[a-1]+nums[b-1]===args[1];}
  return typeof actual==='number'&&Number.isFinite(actual)&&(id==='maximum-average'?Math.abs(actual-Number(expected))<1e-5:Number.isInteger(actual)&&actual===expected);
}
export const SUITE_VERSION='2026-09-22.1';
export function testCases(id:ProblemId, seed=731):{args:JsonValue[];expected:JsonValue;category:string}[] {
  const inputs:JsonValue[][]=[getProblem(id).input];
  const rand=(n:number)=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%n;};
  const edges:Record<ProblemId,JsonValue[][]>={ 'maximum-average':[[[-8,-2,-4],2],[[7],1],[[0,0,0],3]],'maximum-vowels':[['rhythm',2],['aeiou',5],['a',1]],'minimum-size':[[9,[1,1]],[1,[1]],[7,[7,1,1]]],'unique-substring':[[''],[' '],['aaaa'],['a a!']],'two-sum':[[[-3,-1,0,2],-3],[[0,0],0],[[1,2,4,8],12]]};inputs.push(...edges[id]);
  for(let i=0;i<24;i++){const n=2+rand(11),k=1+rand(n);if(id==='maximum-average')inputs.push([Array.from({length:n},()=>rand(21)-10),k]);if(id==='maximum-vowels')inputs.push([Array.from({length:n},()=>'aeioubcd'[rand(8)]).join(''),k]);if(id==='minimum-size')inputs.push([1+rand(40),Array.from({length:n},()=>1+rand(10))]);if(id==='unique-substring')inputs.push([Array.from({length:n},()=>'abc 12!'[rand(7)]).join('')]);if(id==='two-sum'){const nums=Array.from({length:n},(_,j)=>j*j+j);const args:JsonValue[]=[nums,nums[0]+nums[1]];inputs.push(args);}}
  const result=inputs.map((args,i)=>({args,expected:oracle(id,args),category:i===0?'example':i<5?'edge':'generated'}));
  if(id==='maximum-average')result.push({args:[Array(100000).fill(-3),100000],expected:-3,category:'stress'});
  if(id==='maximum-vowels')result.push({args:['a'.repeat(100000),50000],expected:50000,category:'stress'});
  if(id==='minimum-size')result.push({args:[50000,Array(100000).fill(1)],expected:50000,category:'stress'});
  if(id==='unique-substring')result.push({args:['abcde'.repeat(10000)],expected:5,category:'stress'});
  if(id==='two-sum')result.push({args:[[-1000,...Array(29998).fill(0),999],-1],expected:[1,30000],category:'stress'});
  return result;
}

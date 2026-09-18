import type { Challenge, Input, Lesson, Snapshot } from './types';
import { traceAverage } from '../lib/lesson';

export const fmt = (n: number) => Number(n.toFixed(5)).toString();
export const range = (left: number, right: number) => Array.from({length:Math.max(0,right-left+1)},(_,i)=>left+i);
const cell = (index:number, prompt:string, hint:string):Challenge => ({kind:'cell',prompt,hint,accepted:[String(index)]});
const decision = (prompt:string, options:[string,string][], answer:string,hint:string):Challenge => ({kind:'choice',prompt,options:options.map(([key,label])=>({key,label})),accepted:[answer],hint});
const save = (improved:boolean,hint:string) => decision('Should this candidate become our record?', [['save','Save this candidate'],['keep','Keep the previous record']],improved?'save':'keep',hint);
const finish = decision('All candidates checked. Ready for the result?', [['reveal','Reveal the answer']],'reveal','Reveal the answer after checking every candidate.');

export function parseLessonInput(lesson:Lesson,input:Input) {
  let values:(number|string)[];
  if(lesson.inputKind==='numbers') {
    if(!/^-?\d+(\s*,\s*-?\d+)*$/.test(input.raw.trim())) throw Error('Enter whole numbers separated by commas.');
    values=input.raw.split(',').map(Number);
    const max=lesson.id==='two-sum'?1000:10000;
    if(values.some(n=>!Number.isSafeInteger(n)||Math.abs(Number(n))>max)) throw Error(`Values must be integers between ${lesson.id==='minimum-size'?1:-max} and ${max}.`);
    if(lesson.id==='minimum-size'&&values.some(n=>Number(n)<=0)) throw Error('This shrinking rule needs positive values. Use integers greater than zero.');
  } else {
    if(lesson.id==='maximum-vowels'&&!/^[a-z]+$/.test(input.raw)) throw Error('Use lowercase English letters only; enter at least one letter.');
    if(lesson.id==='unique-substring'&&!/^[\x20-\x7E]*$/.test(input.raw)) throw Error('This canvas supports printable ASCII characters, including spaces.');
    values=Array.from(input.raw);
  }
  if(values.length>16) throw Error('Use at most 16 values or characters in this teaching canvas.');
  if(lesson.id!=='unique-substring'&&values.length===0) throw Error('Enter at least one value.');
  const parameter=Number(input.parameter);
  if(lesson.parameter && (!input.parameter.trim()||!Number.isSafeInteger(parameter))) throw Error('Enter a whole number for the parameter.');
  if(['maximum-average','maximum-vowels'].includes(lesson.id)&&(parameter<1||parameter>values.length)) throw Error('Window k must be between 1 and the input length.');
  if(lesson.id==='minimum-size'&&(parameter<1||parameter>1e9)) throw Error('Target must be between 1 and 1,000,000,000.');
  if(lesson.id==='two-sum') {
    const nums=values as number[];
    if(nums.length<2) throw Error('A pair needs at least two values.');
    if(Math.abs(parameter)>1000) throw Error('Target must be between −1,000 and 1,000.');
    if(nums.some((n,i)=>i>0&&n<nums[i-1])) throw Error('Keep the input sorted in non-decreasing order. It will not be sorted for you.');
    let count=0;
    nums.forEach((n,i)=>nums.slice(i+1).forEach(m=>{if(n+m===parameter)count++;}));
    if(count!==1) throw Error('Use an input with exactly one matching index pair, as required by this problem.');
  }
  return {values,parameter};
}

export function buildTrace(lesson:Lesson,input:Input):Snapshot[] {
  const {values,parameter:k}=parseLessonInput(lesson,input);
  const frames:Snapshot[]=[];
  const push=(s:Omit<Snapshot,'id'>)=>frames.push({...s,id:`${lesson.id}-${frames.length}`});
  const pointers=(l:number,r:number)=>l<=r?[{index:l,label:'L'},{index:r,label:'R'}]:[];
  if(lesson.id==='maximum-average') {
    const raw=traceAverage(values as number[],k);
    raw.forEach((f,i)=>{
      const p=raw[Math.max(0,i-1)], done=f.kind==='done';
      const selection=done?range(f.bestLeft,f.bestLeft+k-1):range(f.left,f.right);
      const op=lesson.code[f.line-1].id;
      let challenge:Challenge|undefined;
      if(f.kind==='add'||f.kind==='remove') challenge=cell(f.focus!,f.kind==='remove'?'Which value leaves the window?':'Which value enters next?',f.kind==='remove'?'Remove the leftmost value. The remaining values stay in order.':'Choose the next adjacent value; do not skip positions.');
      if(f.kind==='compare') challenge=save(p.best===null||f.sum>p.best,`Candidate sum ${f.sum}; previous best ${p.best??'none'}. Save only a first or larger sum.`);
      if(done)challenge=finish;
      push({op,title:f.title,explanation:f.explanation,equation:done?`${f.best} ÷ ${k} = ${fmt(f.best!/k)}`:f.kind==='add'||f.kind==='remove'?`${p.sum} ${f.kind==='add'?'+':'−'} (${values[f.focus!]}) = ${f.sum}`:f.kind==='compare'?`best = ${f.best}`:'sum = 0',selected:selection,best:f.best===null?[]:range(f.bestLeft,f.bestLeft+k-1),pointers:pointers(selection[0]??0,selection.at(-1)??-1),range:true,metrics:[{label:done?'Winning sum':'Window sum',value:String(done?f.best:f.sum)},{label:'Current average',value:selection.length===k?fmt((done?f.best!:f.sum)/k):'Incomplete'},{label:'Best average',value:f.best===null?'—':fmt(f.best/k)}],tone:done?'done':f.kind==='compare'?'save':f.kind==='add'?'add':f.kind==='remove'?'remove':'neutral',focus:f.focus,challenge,checkpoint:f.kind==='compare'?{label:`Indices ${f.left}–${f.right}`,value:fmt(f.sum/k)}:undefined,result:done?f.best!/k:undefined});
    });
  } else if(lesson.id==='maximum-vowels') {
    let total=0,best=-1,bestLeft=0;
    const score=(i:number)=>'aeiou'.includes(String(values[i]))?1:0;
    const emit=(l:number,r:number,op:string,title:string,explanation:string,equation:string,tone:Snapshot['tone'],challenge?:Challenge,focus?:number,checkpoint=false)=>push({op,title,explanation,equation,selected:range(l,r),best:best<0?[]:range(bestLeft,bestLeft+k-1),pointers:pointers(l,r),range:true,metrics:[{label:'Vowels in frame',value:String(total)},{label:'Frame size',value:`${Math.max(0,r-l+1)} / ${k}`},{label:'Best count',value:best<0?'—':String(best)}],tone,focus,challenge,checkpoint:checkpoint?{label:`Indices ${l}–${r}`,value:String(total)}:undefined,result:tone==='done'?best:undefined});
    emit(0,-1,'init','Tune into vowels','Every letter occupies a position. Only a, e, i, o, u contribute to the count.','count = 0','neutral');
    for(let i=0;i<k;i++){const previous=total;total+=score(i);emit(0,i,'first','Build the first frame',`${values[i]} ${score(i)?'is a vowel':'is a consonant'} and contributes ${score(i)}.`,`${previous} + ${score(i)} = ${total}`,'add',cell(i,'Which character enters next?','Choose the next character in order.'),i);}
    best=total;emit(0,k-1,'benchmark','Save the first count','This full frame becomes our benchmark.',`best = ${best}`,'save',save(true,'This is the first complete frame, so save it.'),undefined,true);
    for(let r=k;r<values.length;r++) {
      const l=r-k,previous=total;total-=score(l);
      emit(l+1,r-1,'remove','Remove its contribution',`${values[l]} leaves; subtract ${score(l)} from the count.`,`${previous} − ${score(l)} = ${total}`,'remove',cell(l,'Which character leaves?','The character at the left boundary leaves.'),l);
      const partial=total;total+=score(r);emit(l+1,r,'add','Add the new contribution',`${values[r]} contributes ${score(r)}. The frame is full again.`,`${partial} + ${score(r)} = ${total}`,'add',cell(r,'Which character enters next?','Choose the next character to the right.'),r);
      const improved=total>best,old=best;if(improved){best=total;bestLeft=l+1;}
      emit(l+1,r,'save',improved?'A clearer signal':'Keep the record','Compare full frames only. Equal counts keep the earlier winner.',`max(${old}, ${total}) = ${best}`,'save',save(improved,`Compare ${total} vowels with the record ${old}.`),undefined,true);
    }
    total=best;emit(bestLeft,bestLeft+k-1,'done','The clearest signal',`The best frame contains ${best} vowels.`,`maximum vowel count = ${best}`,'done',finish);
  } else if(lesson.id==='minimum-size') {
    const nums=values as number[];let left=0,total=0,best=Infinity,bestIndices:number[]=[];
    const emit=(right:number,op:string,title:string,equation:string,tone:Snapshot['tone'],challenge?:Challenge,focus?:number,checkpoint=false)=>push({op,title,explanation:total>=k?'The sum reaches the target. Save a shorter candidate, then try shrinking.':'The sum is below the target. Expand right if another value is available.',equation,selected:tone==='done'?bestIndices:range(left,right),best:[...bestIndices],pointers:tone==='done'?pointers(bestIndices[0]??0,bestIndices.at(-1)??-1):pointers(left,right),range:true,metrics:[{label:'Window sum',value:String(total)},{label:'Target',value:String(k)},{label:'Shortest length',value:best===Infinity?'None yet':String(best)}],tone,focus,challenge,checkpoint:checkpoint?{label:`Indices ${left}–${right}`,value:String(right-left+1)}:undefined,result:tone==='done'?(best===Infinity?0:best):undefined});
    emit(-1,'init','Pack just enough','sum = 0','neutral');
    for(let right=0;right<nums.length;right++) {
      const old=total;total+=nums[right];emit(right,'add','Expand to gain supplies',`${old} + ${nums[right]} = ${total}`,'add',decision('Expand or shrink?', [['expand','Expand right'],['shrink','Shrink left']],'expand',`Before adding, the sum was ${old}, below target ${k}. Positive values let expansion increase it.`),right);
      while(total>=k) {
        const length=right-left+1,improved=length<best,oldBest=best;if(improved){best=length;bestIndices=range(left,right);}
        emit(right,'save',improved?'A shorter valid bag':'Keep the shortest bag',`min(${oldBest===Infinity?'∞':oldBest}, ${length}) = ${best}`,'save',save(improved,`This valid candidate has ${length} items. Previous shortest: ${oldBest===Infinity?'none':oldBest}. Save only a shorter length.`),undefined,true);
        const outgoing=left,previous=total;total-=nums[left];left++;
        emit(right,'remove','Try one fewer package',`${previous} − ${nums[outgoing]} = ${total}`,'remove',cell(outgoing,'Which package should leave?','We already have enough. Remove the leftmost package to test a shorter group.'),outgoing);
      }
    }
    emit(nums.length-1,'done',best===Infinity?'No group reaches the target':'The shortest valid group',`answer = ${best===Infinity?0:best}`,'done',finish);
    frames.at(-1)!.explanation=best===Infinity?'Even the available groups cannot reach the target. Return 0, with no winning selection.':`The gold range has ${best} items and reaches the target. All shorter possibilities were ruled out.`;
    frames.at(-1)!.metrics[0]={label:'Winning sum',value:bestIndices.length?String(bestIndices.reduce((a,i)=>a+nums[i],0)):'—'};
  } else if(lesson.id==='unique-substring') {
    const chars=values as string[];let left=0,best=0,bestIndices:number[]=[];const counts:Record<string,number>={};
    const emit=(right:number,op:string,title:string,explanation:string,equation:string,tone:Snapshot['tone'],challenge?:Challenge,focus?:number,checkpoint=false)=>push({op,title,explanation,equation,selected:tone==='done'?bestIndices:range(left,right),best:[...bestIndices],pointers:tone==='done'?pointers(bestIndices[0]??0,bestIndices.at(-1)??-1):pointers(left,right),range:true,metrics:[{label:'Window length',value:String(tone==='done'?best:Math.max(0,right-left+1))},{label:'Unique?',value:Object.values(counts).every(n=>n<=1)?'Yes':'Duplicate'},{label:'Longest length',value:String(best)}],conflicts:tone==='done'?[]:range(left,right).filter(i=>counts[chars[i]]>1),status:{label:tone==='done'?'Unique winning range':Object.values(counts).some(n=>n>1)?'Duplicate · shrink left':'Unique window',invalid:tone!=='done'&&Object.values(counts).some(n=>n>1)},memory:Object.entries(counts).filter(([,n])=>n>0).map(([label,value])=>({label:label===' '?'space':label,value,invalid:value>1})),tone,focus,challenge,checkpoint:checkpoint?{label:`Indices ${left}–${right}`,value:String(right-left+1)}:undefined,result:tone==='done'?best:undefined});
    emit(-1,'init','Open the guest list','Start empty. Every saved candidate must have no duplicate characters.','best = 0','neutral');
    for(let right=0;right<chars.length;right++) {
      const char=chars[right];counts[char]=(counts[char]??0)+1;
      emit(right,'add','A new guest arrives',counts[char]>1?'A duplicate is present. Do not save this invalid window.':'All guests are unique; this candidate can be compared.',`count(${JSON.stringify(char)}) = ${counts[char]}`,'add',cell(right,'Which character arrives next?','Advance in order to the next adjacent character.'),right);
      while(counts[char]>1) {
        const outgoing=left,c=chars[left];counts[c]--;left++;
        emit(right,'remove','Resolve the duplicate',counts[char]>1?'The duplicate remains. Keep shrinking from the left.':'The duplicate is resolved. The current window is valid.',`count(${JSON.stringify(c)}) decreases to ${counts[c]}`,'remove',decision('A duplicate is present. What now?', [['shrink','Remove the leftmost character'],['save','Save this window'],['expand','Add another character']],'shrink','A duplicate makes this window invalid. Remove from the left until each count is at most 1.'),outgoing);
      }
      const length=right-left+1,improved=length>best,old=best;if(improved){best=length;bestIndices=range(left,right);}
      emit(right,'save',improved?'A longer unique list':'Keep the longest list','Only valid, contiguous windows compete for the record.',`max(${old}, ${length}) = ${best}`,'save',save(improved,`Compare valid length ${length} to the previous best ${old}.`),undefined,true);
    }
    emit(chars.length-1,'done','One of each, as long as possible',best?'The gold range is a longest unique substring. Equal-length alternatives are also valid.':'The input is empty, so the answer is 0.','maximum length = '+best,'done',finish);
    frames.at(-1)!.memory=Array.from(new Set(bestIndices.map(i=>chars[i]))).map(label=>({label:label===' '?'space':label,value:1}));
  } else {
    const nums=values as number[];let left=0,right=nums.length-1;
    const emit=(op:string,title:string,explanation:string,equation:string,tone:Snapshot['tone'],challenge?:Challenge,focus?:number)=>push({op,title,explanation,equation,selected:[left,right],best:tone==='done'?[left,right]:[],pointers:pointers(left,right),range:false,metrics:[{label:'Pair sum',value:String(nums[left]+nums[right])},{label:'Target',value:String(k)},{label:'Positions (1-based)',value:`${left+1}, ${right+1}`}],tone,focus,challenge,checkpoint:op==='sum'?{label:`Positions ${left+1} & ${right+1}`,value:String(nums[left]+nums[right])}:undefined,result:tone==='done'?[left+1,right+1]:undefined});
    emit('init','Two ends of a sorted shelf','Only the two pointed values are selected. The middle values do not contribute.',`L = 0, R = ${right}`,'neutral');
    while(left<right) {
      const total=nums[left]+nums[right];
      emit('sum','Compare the pair',total<k?'The pair is too small. The left value cannot work with any remaining partner.':total>k?'The pair is too large. The right value cannot work with any remaining partner.':'The two values add to the target.',`${nums[left]} + (${nums[right]}) = ${total}`,'neutral',decision('Check the two selected values.',[['compare','Compare pair sum']],'compare','Only the two pointer values contribute.'));
      if(total===k){emit('done','The pair meets the target','Return the two 1-based positions. These are positions, not the values.',`answer = [${left+1}, ${right+1}]`,'done',decision('The sum matches. What should we do?', [['return','Return their positions'],['left','Move left pointer'],['right','Move right pointer']],'return','The exact target has been reached. Return the two distinct positions.'));break;}
      const moveLeft=total<k,old=moveLeft?left:right;if(moveLeft)left++;else right--;
      emit(moveLeft?'left':'right',moveLeft?'Move toward a larger value':'Move toward a smaller value',moveLeft?'Sorted order means moving L right raises or preserves the left value.':'Sorted order means moving R left lowers or preserves the right value.',`${moveLeft?'L':'R'}: ${old} → ${moveLeft?left:right}`,'remove',decision('Which pointer should move?', [['left','Move L right'],['right','Move R left']],moveLeft?'left':'right',`Pair sum ${total} is ${moveLeft?'below':'above'} target ${k}. ${moveLeft?'Increase the left value.':'Decrease the right value.'}`),moveLeft?left:right);
      frames.at(-1)!.motion={label:moveLeft?'L':'R',from:old,to:moveLeft?left:right};
    }
  }
  if(frames.length>500) throw Error('This input creates too many teaching steps. Try a shorter input.');
  for(const frame of frames) if(!lesson.code.some(line=>line.id===frame.op))throw Error(`Missing code mapping: ${frame.op}`);
  return frames;
}

export function checkPractice(answer:string,expected:number|number[]) {
  if(!answer.trim())return false;
  if(Array.isArray(expected)) {
    const raw=answer.trim().replace(/^\[/,'').replace(/\]$/,'');
    if(!/^\d+\s*,\s*\d+$/.test(raw))return false;
    const numbers=raw.split(',').map(Number).sort((a,b)=>a-b);
    return numbers.every((n,i)=>n===[...expected].sort((a,b)=>a-b)[i]);
  }
  return Number.isFinite(Number(answer))&&Math.abs(Number(answer)-expected)<0.00001;
}

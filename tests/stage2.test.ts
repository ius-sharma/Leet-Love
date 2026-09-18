import test from 'node:test';
import assert from 'node:assert/strict';
import { lessons } from '../src/lessons/catalog.ts';
import { buildTrace, parseLessonInput, checkPractice } from '../src/lessons/engine.ts';
import { initialPlayer, playerReducer } from '../src/lib/player.ts';
import { decodeProgress, restoreLesson, saveLesson } from '../src/lib/progress.ts';

test('all five default lessons have correct results and complete operation mappings',()=>{
  const expected=[12.75,3,2,3,[1,2]];
  lessons.forEach((lesson,i)=>{
    const frames=buildTrace(lesson,lesson.defaults);
    assert.deepEqual(frames.at(-1)!.result,expected[i]);
    assert.equal(new Set(frames.map(f=>f.id)).size,frames.length);
    frames.forEach((frame,index)=>{
      assert.ok(lesson.code.some(line=>line.id===frame.op));
      if(index>0){assert.ok(frame.challenge);assert.ok(frame.challenge!.accepted.length);}
    });
    for(const preset of lesson.presets)assert.equal(buildTrace(lesson,preset.input).at(-1)!.tone,'done');
  });
});
test('generated fixed/variable windows agree with independent brute force results',()=>{
  let seed=13;const rand=(n:number)=>{seed=(seed*1664525+1013904223)>>>0;return seed%n;};
  for(let run=0;run<70;run++){
    const n=1+rand(12),nums=Array.from({length:n},()=>1+rand(8)),k=1+rand(n),target=1+rand(35);
    const signed=nums.map(x=>x-4);
    const means=Array.from({length:n-k+1},(_,l)=>signed.slice(l,l+k).reduce((a,b)=>a+b,0)/k);
    assert.equal(buildTrace(lessons[0],{raw:signed.join(','),parameter:String(k)}).at(-1)!.result,Math.max(...means));
    const s=Array.from({length:n},()=>'aeibcd'[rand(6)]).join('');
    const vowels=Array.from({length:n-k+1},(_,l)=>[...s.slice(l,l+k)].filter(c=>'aeiou'.includes(c)).length);
    assert.equal(buildTrace(lessons[1],{raw:s,parameter:String(k)}).at(-1)!.result,Math.max(...vowels));
    let minimum=Infinity,unique=0;
    for(let l=0;l<n;l++)for(let r=l;r<n;r++){
      if(nums.slice(l,r+1).reduce((a,b)=>a+b,0)>=target)minimum=Math.min(minimum,r-l+1);
      const sub=s.slice(l,r+1);if(new Set(sub).size===sub.length)unique=Math.max(unique,sub.length);
    }
    assert.equal(buildTrace(lessons[2],{raw:nums.join(','),parameter:String(target)}).at(-1)!.result,minimum===Infinity?0:minimum);
    assert.equal(buildTrace(lessons[3],{raw:s,parameter:''}).at(-1)!.result,unique);
  }
});
test('generated sorted pairs select only endpoints and return matching 1-based positions',()=>{
  for(let n=2;n<=12;n++){
    const nums=Array.from({length:n},(_,i)=>i*i+2*i-20);
    for(let l=0;l<n;l++)for(let r=l+1;r<n;r++){
      const target=nums[l]+nums[r];let count=0;
      for(let a=0;a<n;a++)for(let b=a+1;b<n;b++)if(nums[a]+nums[b]===target)count++;
      if(count!==1)continue;
      const frames=buildTrace(lessons[4],{raw:nums.join(','),parameter:String(target)});
      assert.deepEqual(frames.at(-1)!.result,[l+1,r+1]);
      for(const f of frames){assert.equal(f.range,false);assert.equal(f.selected.length,2);assert.notEqual(f.selected[0],f.selected[1]);assert.equal(Number(f.metrics[0].value),f.selected.reduce((a,i)=>a+nums[i],0));}
    }
  }
});
test('intermediate sums, frequencies, saved ranges, and empty cases remain accurate',()=>{
  for(const lesson of lessons){
    const {values,parameter}=parseLessonInput(lesson,lesson.defaults);
    const frames=buildTrace(lesson,lesson.defaults);
    for(const f of frames){
      assert.ok(f.selected.every(i=>i>=0&&i<values.length));
      if(lesson.id==='minimum-size'){assert.equal(Number(f.metrics[0].value),f.selected.reduce((a,i)=>a+Number(values[i]),0));if(f.best.length)assert.ok(f.best.reduce((a,i)=>a+Number(values[i]),0)>=parameter);}
      if(lesson.id==='unique-substring'){
        const counts:Record<string,number>={};f.selected.forEach(i=>{const label=values[i]===' '?'space':String(values[i]);counts[label]=(counts[label]??0)+1;});
        assert.deepEqual(Object.fromEntries((f.memory??[]).map(m=>[m.label,m.value])),counts);
        if(f.tone==='save'||f.tone==='done')assert.equal(new Set(f.selected.map(i=>values[i])).size,f.selected.length);
      }
    }
  }
  assert.equal(buildTrace(lessons[3],{raw:'',parameter:''}).at(-1)!.result,0);
  assert.equal(buildTrace(lessons[3],{raw:'a a!',parameter:''}).at(-1)!.result,3);
  assert.deepEqual(buildTrace(lessons[2],{raw:'1,1',parameter:'9'}).at(-1)!.selected,[]);
});
test('invalid inputs preserve domain prerequisites',()=>{
  for(const [index,raw,parameter] of [[0,'1,,2','1'],[0,'1,2','3'],[1,'Abc','1'],[1,'abc','0'],[2,'1,-2','4'],[2,'1,2','0'],[3,'😀',''],[4,'3,1,2','3'],[4,'1,2,3','9'],[4,'1,1,2,2','3']] as const)assert.throws(()=>parseLessonInput(lessons[index],{raw,parameter}));
  assert.throws(()=>parseLessonInput(lessons[0],{raw:Array(17).fill(1).join(','),parameter:'1'}));
});
test('guided actions reject mistakes and stale clicks; exploration and reset stay separate',()=>{
  const lesson=lessons[0],frames=buildTrace(lesson,lesson.defaults);let state=initialPlayer(lesson.defaults,frames);
  state=playerReducer(state,{type:'choose',key:'4',from:0});assert.equal(state.step,0);assert.ok(state.feedback);
  state=playerReducer(state,{type:'choose',key:'0',from:0});assert.equal(state.step,1);assert.equal(state.feedback,'');
  state=playerReducer(state,{type:'choose',key:'1',from:0});assert.equal(state.step,1);
  state=playerReducer(state,{type:'seek',step:frames.length-1});const furthest=state.furthest;
  state=playerReducer(state,{type:'seek',step:2});assert.equal(state.furthest,furthest);
  state=playerReducer(state,{type:'play'});assert.equal(state.playing,false);
  state=playerReducer(state,{type:'mode',mode:'watch'});state=playerReducer(state,{type:'play'});assert.equal(state.playing,true);
  state=playerReducer(state,{type:'reset'});assert.equal(state.step,0);assert.equal(state.furthest,0);assert.equal(state.playing,false);
});
test('every guided lesson can be completed with its accepted actions',()=>{
  for(const lesson of lessons){let state=initialPlayer(lesson.defaults,buildTrace(lesson,lesson.defaults));while(state.step<state.frames.length-1){const from=state.step,key=state.frames[from+1].challenge!.accepted[0];state=playerReducer(state,{type:'choose',key,from});assert.equal(state.step,from+1);}assert.equal(state.frames[state.step].tone,'done');}
});
test('versioned progress restores safely and does not grant practice completion by watching',()=>{
  const lesson=lessons[0];let state=initialPlayer(lesson.defaults,buildTrace(lesson,lesson.defaults));state=playerReducer(state,{type:'seek',step:12});
  const saved=saveLesson(lesson,state,[]),restored=restoreLesson(lesson,saved);assert.equal(restored.state.step,12);assert.deepEqual(restored.practices,[]);assert.equal(restored.state.playing,false);
  assert.equal(restoreLesson(lesson,{...saved,version:999}).discarded,true);
  assert.equal(restoreLesson(lesson,{...saved,input:{raw:'bad',parameter:'4'}}).restored,false);
  assert.equal(restoreLesson(lesson,{...saved,step:-1}).restored,false);
  assert.equal(restoreLesson(lesson,{...saved,step:999,furthest:999}).state.step,12);
  assert.deepEqual(restoreLesson(lesson,{...saved,practices:[0,0,1,9]}).practices,[0,1]);
  for(const raw of ['broken','null','{"schema":99}','{"schema":1,"lessons":[]}'])assert.deepEqual(decodeProgress(raw),{schema:1,lessons:{}});
});
test('practice accepts numeric tolerance and both pair orders but rejects blank answers',()=>{
  assert.equal(checkPractice('',0),false);assert.equal(checkPractice('3.500001',3.5),true);assert.equal(checkPractice('3.6',3.5),false);
  assert.equal(checkPractice('[4, 3]',[3,4]),true);assert.equal(checkPractice('3, 3',[3,4]),false);
});

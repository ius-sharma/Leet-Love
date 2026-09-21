import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { equalResult, getProblem, oracle, problems, testCases, validateInput, bruteAverage } from '../src/submissions/problems';
import { validateStory, validateTrace, submissionSchema } from '../src/submissions/contracts';
import examples from '../src/submissions/examples.json';

test('judge rejects fractional integer answers, invalid pairs, and NaN',()=>{
  assert.equal(equalResult('maximum-vowels',3.1,3,['aei',3]),false);
  assert.equal(equalResult('minimum-size',1.8,2,[7,[4,3]]),false);
  assert.equal(equalResult('maximum-average',3.500001,3.5,[[3,4],2]),true);
  assert.equal(equalResult('maximum-average',NaN,0,[[0],1]),false);
  assert.equal(equalResult('two-sum',[2,1],[1,2],[[2,7],9]),true);
  assert.equal(equalResult('two-sum',[1,1],[1,2],[[2,7],9]),false);
  assert.equal(equalResult('two-sum',[0,3],[1,2],[[2,7],9]),false);
});
test('problem suites contain valid domain cases, independent oracle results, and stress cases',()=>{
  for(const problem of problems){
    const cases=testCases(problem.id,412);
    assert.ok(cases.length>=29);
    for(const c of cases){validateInput(problem.id,c.args,false);if(c.category!=='stress')assert.deepEqual(oracle(problem.id,c.args),c.expected);}
    assert.ok(cases.some(c=>c.category==='stress'));
  }
});
test('teaching input cannot bypass domain or resource limits',()=>{
  for(const [problem,args] of [['maximum-average',[[1,2],3]],['minimum-size',[3,[1,-1]]],['maximum-vowels',['ABC',2]],['unique-substring',['😀']],['two-sum',[[2,1],3]],['two-sum',[[1,1,2,2],3]]] as const)assert.throws(()=>validateInput(problem,JSON.parse(JSON.stringify(args))));
  assert.throws(()=>validateInput('maximum-average',[Array(17).fill(1),1]));
  validateInput('unique-substring',['']);
  assert.equal(submissionSchema.safeParse({problem:'arbitrary',source:'x',input:[],requestId:'bad'}).success,false);
});
test('authored sliding and nested-loop samples have different actual traces with the same result',()=>{
  const sources=[getProblem('maximum-average').starter,bruteAverage];
  const traces=sources.map((source,i)=>validateTrace(examples[i],createHash('sha256').update(source).digest('hex'),source));
  assert.equal(traces[0].result,12.75);assert.equal(traces[1].result,12.75);
  assert.notEqual(traces[0].events.length,traces[1].events.length);
  assert.ok(traces[1].events.some(e=>Object.hasOwn(e.locals,'start')));
  assert.ok(traces[0].events.some(e=>Object.hasOwn(e.locals,'right')));
  assert.throws(()=>validateTrace({...examples[0],complete:false},examples[0].sourceHash,sources[0]));
  const broken=structuredClone(examples[0]);broken.events[1].line=9999;
  assert.throws(()=>validateTrace(broken,examples[0].sourceHash,sources[0]));
});
test('story references must match existing variables and ordered trace checkpoints',()=>{
  const trace=validateTrace(examples[0],examples[0].sourceHash,getProblem('maximum-average').starter);
  const story={title:'A ledger',premise:'Record the journey.',mappings:[{variable:'total',role:'The balance'}],chapters:[{eventId:0,title:'Begin',narration:'Read the input.'},{eventId:trace.events.length-1,title:'Finish',narration:'Return the result.'}],limitation:'A small example.'};
  assert.equal(validateStory(story,trace).title,'A ledger');
  assert.throws(()=>validateStory({...story,mappings:[{variable:'imaginary',role:'Fake'}]},trace));
  assert.throws(()=>validateStory({...story,chapters:[...story.chapters].reverse()},trace));
});

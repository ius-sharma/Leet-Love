// Only repository-owned fixtures. This is never called by the web app or worker.
import { spawnSync } from 'node:child_process';
import { problems, testCases, equalResult, bruteAverage } from '../src/submissions/problems';
import type { JsonValue } from '../src/submissions/contracts';
const fixtures=problems.flatMap(problem=>{
  const base=problem.starter;
  return [
    ...Array.from({length:7},(_,i)=>({name:`${problem.id}-valid-${i}`,problem,source:i===0?base:base.replace(/\b(total|count|best|seen|left|right)\b/g,`state_${i}_$1`),valid:true})),
    ...Array.from({length:3},(_,i)=>({name:`${problem.id}-wrong-${i}`,problem,source:`class Solution:\n    def ${problem.signature}:\n        return ${i===0?'0':i===1?'1.1':'None'}\n`,valid:false})),
  ];
});
fixtures.push({name:'average-brute',problem:problems[0],source:bruteAverage,valid:true});
const payload=fixtures.map(f=>({...f,tests:testCases(f.problem.id,987).filter(t=>t.category!=='stress').slice(0,9)}));
const program=`import sys,json\nfrom workers.python.runner import execute\ndata=json.load(sys.stdin)\nout=[]\nfor fixture in data:\n results=[]\n for test in fixture['tests']:\n  try:\n   result=execute(fixture['source'],fixture['problem']['method'],test['args'])\n   results.append({'result':result['result']})\n  except Exception as error:\n   results.append({'error':type(error).__name__})\n out.append(results)\nprint(json.dumps(out))`;
const run=spawnSync('python',['-E','-S','-c',program],{input:JSON.stringify(payload),encoding:'utf8',timeout:30000,maxBuffer:4*1024*1024});
if(run.status!==0)throw Error(run.stderr||'Corpus execution failed.');
const outputs=JSON.parse(run.stdout) as {result?:JsonValue;error?:string}[][];
let accepted=0,rejected=0;
payload.forEach((fixture,i)=>{
  const passed=outputs[i].every((r,j)=>!r.error&&equalResult(fixture.problem.id,r.result,fixture.tests[j].expected,fixture.tests[j].args));
  if(passed!==fixture.valid)throw Error(`Wrong verdict for ${fixture.name}`);
  if(passed)accepted++;else rejected++;
});
console.log(`${payload.length} repository-owned submission variants checked: ${accepted} accepted, ${rejected} rejected. Local fixture tests do not certify cloud sandbox isolation.`);

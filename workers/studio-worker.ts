import { createHash } from 'node:crypto';
import { database } from '../src/server/studio/database';
import { configuration } from '../src/server/studio/config';
import { SolutionSandbox, ExecutionFailure } from '../src/server/studio/sandbox';
import { generateStory, PROMPT_VERSION } from '../src/server/studio/groq';
import { getProblem, testCases, equalResult, oracle, SUITE_VERSION } from '../src/submissions/problems';
import { validateTrace, type Artifact, type Job, type ExecutionTrace } from '../src/submissions/contracts';

const db=database();
let stopping=false;process.on('SIGINT',()=>{stopping=true;});process.on('SIGTERM',()=>{stopping=true;});
async function processJob(job:Job&{lease_token:string;checkpoint?:{trace:ExecutionTrace;passed:number}}){
  const sandbox=new SolutionSandbox(),abort=new AbortController();let alive=true;
  const patch=async(fields:Record<string,unknown>)=>{
    const {data,error}=await db.from('solution_jobs').update({...fields,updated_at:new Date().toISOString(),lease_until:new Date(Date.now()+90000).toISOString()}).eq('id',job.id).eq('lease_token',job.lease_token).in('stage',['validating','tracing','generating','checking']).select('id');
    if(error||!data?.length){alive=false;abort.abort();await sandbox.close();throw new ExecutionFailure('cancelled','Job cancelled or lease lost.');}
  };
  const heartbeat=setInterval(()=>{void patch({}).catch(()=>{});},5000);
  const deadline=setTimeout(()=>{alive=false;abort.abort();void sandbox.close();},180000);
  try{
    let trace=job.checkpoint?.trace,passed=job.checkpoint?.passed??0;
    if(!trace){
      await sandbox.start();const problem=getProblem(job.problem);
      const tests=testCases(job.problem,parseInt(job.source_hash.slice(0,8),16));
      for(const [i,test] of tests.entries()){
        if(!alive||stopping)throw new ExecutionFailure('cancelled','Execution stopped.');
        const output=await sandbox.execute(job.source,problem.method,test.args);
        if(!equalResult(job.problem,output.result,test.expected,test.args))throw new ExecutionFailure('wrong-answer',`Your solution did not pass a ${test.category} case. Recheck boundaries and the problem contract.`);
        passed++;await patch({message:`Checking solution · ${i+1}/${tests.length} cases passed.`});
      }
      await patch({stage:'tracing',message:'Recording your actual code on the teaching example.'});
      const original=await sandbox.execute(job.source,problem.method,job.input);
      const recorded=await sandbox.execute(job.source,problem.method,job.input,true);
      if(JSON.stringify(original.result)!==JSON.stringify(recorded.result)||JSON.stringify(original.mutatedInput)!==JSON.stringify(recorded.mutatedInput))throw new ExecutionFailure('trace','Tracing changed the execution. This construct cannot be visualized reliably.');
      if(!equalResult(job.problem,original.result,oracle(job.problem,job.input),job.input))throw new ExecutionFailure('wrong-answer','The selected teaching example did not pass validation.');
      trace=validateTrace(recorded.trace,job.source_hash,job.source);
      await patch({checkpoint:{trace,passed}});job.checkpoint={trace,passed};await sandbox.close();
    }
    await patch({stage:'generating',message:'Building a story around your recorded execution.'});
    const story=await generateStory(trace,getProblem(job.problem).title,abort.signal);
    await patch({stage:'checking',message:'Checking story references, source mapping, and final result.'});
    validateTrace(trace,job.source_hash,job.source);
    const artifact:Artifact={version:1,sourceHash:job.source_hash,trace,story,model:configuration().model,promptVersion:PROMPT_VERSION,suiteVersion:SUITE_VERSION,passed,source:job.source,problem:job.problem,createdAt:new Date().toISOString()};
    await patch({stage:'ready',message:'Here are the visuals and story for your solution.',artifact,artifact_hash:createHash('sha256').update(JSON.stringify(artifact)).digest('hex'),checkpoint:null});
  }catch(error){
    const message=error instanceof ExecutionFailure?`${error.kind}: ${error.message}`:job.checkpoint?'Validation passed; story generation failed. Retry from your workspace.':(error as Error).message;
    await db.from('solution_jobs').update({stage:'failed',message:message.slice(0,600),lease_token:null,lease_until:null}).eq('id',job.id).eq('lease_token',job.lease_token).neq('stage','cancelled');
  }finally{clearInterval(heartbeat);clearTimeout(deadline);abort.abort();await sandbox.close();}
}
async function main(){
  const config=configuration();if(!config.ready)throw Error(`Configure ${config.missing.join(', ')} before starting the worker.`);
  console.log('LeetLove worker ready. Uploaded code executes only in E2B.');
  while(!stopping){const {data,error}=await db.rpc('claim_solution');if(error)throw Error('Queue migration or service-role configuration is unavailable.');const job=data?.[0];if(job)await processJob(job);else await new Promise(resolve=>setTimeout(resolve,2000));}
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});

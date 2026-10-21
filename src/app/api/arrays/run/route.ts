import { createHash } from 'node:crypto';
import { getMission } from '@/arrays/curriculum';
import { accepts, casesFor, expected } from '@/arrays/engine';
import { database, identity } from '@/server/studio/database';
import { StudioError } from '@/server/studio/config';
import { readBody } from '@/server/studio/request';
import { ExecutionFailure, SolutionSandbox } from '@/server/studio/sandbox';
import { validateTrace, type JsonValue } from '@/submissions/contracts';
import { sameOrigin } from '@/auth/config';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
const ready=()=>['SUPABASE_URL','SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY','E2B_API_KEY','E2B_TEMPLATE_ID'].every(k=>!!process.env[k])&&process.env.LEETLOVE_ARRAY_RUNS_ENABLED==='true';
export async function GET(){return reply({ready:ready(),url:process.env.SUPABASE_URL??null,anonKey:process.env.SUPABASE_ANON_KEY??null});}
export async function POST(request:Request){
  const sandbox=new SolutionSandbox();let owner:string|undefined;
  const cancel=()=>{void sandbox.close();};
  try{
    if(!sameOrigin(request))throw new StudioError('Cross-origin request rejected.',403);
    if(!ready())throw new StudioError('Code execution is not enabled yet. Your draft stays on this device; guided missions still work.',503);
    const user=await identity(request),body=await readBody(request,60000);
    const m=typeof body.mission==='string'?getMission(body.mission):undefined;
    if(!m||typeof body.source!=='string'||!body.source.trim()||Buffer.byteLength(body.source)>50000)throw new StudioError('Choose a valid mission and Python source under 50 KB.');
    const {data,error}=await database().rpc('reserve_array_run',{p_owner:user});
    if(error)throw new StudioError('The execution service needs its database migration. Your draft is safe.',503);
    if(!data)throw new StudioError('A run is already active or your 30 daily runs are used. Try again later.',429);
    owner=user;request.signal.addEventListener('abort',cancel);
    await sandbox.start();
    const checks=[];let trace;
    for(const [i,c] of casesFor(m.id).entries()){
      if(request.signal.aborted)throw new StudioError('Run cancelled.',408);
      const args:JsonValue[]=c.target===undefined?[c.nums]:[c.nums,c.target];
      const run=await sandbox.execute(body.source,m.method,args,i===0);
      if(i===0)trace=validateTrace(run.trace,createHash('sha256').update(body.source).digest('hex'),body.source);
      checks.push({label:c.label,input:args,passed:accepts(m.id,c,run.result,run.mutatedInput[0]),actual:run.result,expected:expected(m.id,c)});
    }
    return reply({checks,trace,source:body.source,passed:checks.every(c=>c.passed)});
  }catch(e){
    return reply({error:e instanceof StudioError||e instanceof ExecutionFailure?e.message:'The execution service could not finish this run. Please retry.'},e instanceof StudioError?e.status:e instanceof ExecutionFailure?422:503);
  }finally{
    request.signal.removeEventListener('abort',cancel);await sandbox.close();
    // A cleanup outage must not replace a finished result; the lease expires anyway.
    if(owner)try{await database().from('array_run_budget').update({lease_until:new Date().toISOString()}).eq('owner_id',owner);}catch{}
  }
}

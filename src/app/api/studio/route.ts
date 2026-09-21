import { createHash } from 'node:crypto';
import { z } from 'zod';
import { configuration, StudioError } from '@/server/studio/config';
import { database, identity, ownerJob } from '@/server/studio/database';
import { submissionSchema } from '@/submissions/contracts';
import { validateInput } from '@/submissions/problems';
import { readBody } from '@/server/studio/request';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
function failure(error:unknown){return reply({error:error instanceof StudioError?error.message:error instanceof z.ZodError?'Please check the submitted fields.':'The service could not complete this request.'},error instanceof StudioError?error.status:error instanceof z.ZodError?400:503);}
export async function GET(request:Request){try{
  const url=new URL(request.url);
  if(url.searchParams.get('config')==='1'){const c=configuration();return reply({...c,url:process.env.SUPABASE_URL??null,anonKey:process.env.SUPABASE_ANON_KEY??null});}
  if(url.searchParams.has('public')){const id=z.string().uuid().parse(url.searchParams.get('public'));const {data,error}=await database().from('solution_publications').select('id,payload,author_name,consented_at').eq('id',id).eq('visible',true).maybeSingle();if(error)throw new StudioError('Public preview unavailable.',503);if(!data)throw new StudioError('This story is unavailable or has been unpublished.',404);return reply(data);}
  const owner=await identity(request),id=url.searchParams.get('id');
  if(id){const job=await ownerJob(owner,z.string().uuid().parse(id));const {data:publication}=await database().from('solution_publications').select('id,visible,include_source').eq('job_id',id).eq('owner_id',owner).maybeSingle();const {lease_token:_,checkpoint:__,lease_until:___,...safe}=job;return reply({...safe,publication,canRetry:job.stage==='failed'&&!!job.checkpoint&&job.attempts<3});}
  const {data,error}=await database().from('solution_jobs').select('id,problem,stage,message,created_at').eq('owner_id',owner).order('created_at',{ascending:false}).limit(30);if(error)throw new StudioError('Could not load your workspace.',503);return reply(data);
}catch(error){return failure(error);}}
export async function POST(request:Request){try{
  // Bearer tokens are explicit, not ambient cookies; additionally reject cross-origin writes.
  const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)throw new StudioError('Cross-origin request rejected.',403);
  const owner=await identity(request),body=await readBody(request),db=database();
  if(body.action==='submit'){
    if(!configuration().ready)throw new StudioError('Generation is not configured yet. Your draft stays in this browser.',503);
    const input=submissionSchema.parse(body);if(Buffer.byteLength(input.source)>50000)throw new StudioError('Source exceeds 50 KB.',413);
    try{validateInput(input.problem,input.input);}catch(error){throw new StudioError((error as Error).message);}
    const {data,error}=await db.rpc('enqueue_solution',{p_owner:owner,p_request:input.requestId,p_problem:input.problem,p_source:input.source,p_hash:createHash('sha256').update(input.source).digest('hex'),p_input:input.input});
    if(error)throw new StudioError(error.message.includes('limit')?'Daily generation limit reached.':error.message.includes('active')?'You already have an active explanation.':'Could not queue this explanation.',429);
    return reply({id:data},202);
  }
  const id=z.string().uuid().parse(body.id);
  if(body.action==='report'){const reason=z.string().min(10).max(1000).parse(body.reason);const {data:p}=await db.from('solution_publications').select('id').eq('id',id).eq('visible',true).maybeSingle();if(!p)throw new StudioError('Publication not found.',404);const {error}=await db.from('solution_reports').upsert({publication_id:id,reporter_id:owner,reason},{onConflict:'publication_id,reporter_id'});if(error)throw new StudioError('Could not save report.',503);return reply({ok:true});}
  const job=await ownerJob(owner,id);
  if(body.action==='retry'){const {error}=await db.rpc('retry_solution',{p_owner:owner,p_job:id});if(error)throw new StudioError('Only a failed story with a saved trace and retries remaining can be retried.',409);return reply({ok:true});}
  if(body.action==='cancel'){const {error}=await db.from('solution_jobs').update({stage:'cancelled',message:'Cancelled by you.',lease_token:null,lease_until:null}).eq('id',id).eq('owner_id',owner).in('stage',['queued','validating','tracing','generating','checking']);if(error)throw new StudioError('Could not cancel.',503);return reply({ok:true});}
  if(body.action==='delete'){const {error}=await db.from('solution_jobs').delete().eq('id',id).eq('owner_id',owner);if(error)throw new StudioError('Could not delete.',503);return reply({ok:true});}
  if(body.action==='publish'){
    if(!configuration().publishing)throw new StudioError('Public sharing is not enabled for this beta yet.',503);
    if(body.consent!==true)throw new StudioError('Confirm publication of this exact preview.');
    const author=z.string().trim().min(1).max(60).parse(body.author),hash=z.string().length(64).parse(body.hash);
    const text=JSON.stringify(job.artifact??{});if(/(?:sk-[A-Za-z0-9]{20,}|gsk_[A-Za-z0-9]{20,}|-----BEGIN .*PRIVATE KEY-----)/.test(text))throw new StudioError('Possible secret found. Remove it in a new revision before publishing.');
    const {data,error}=await db.rpc('publish_solution',{p_owner:owner,p_job:id,p_hash:hash,p_include:body.includeSource===true,p_author:author,p_consent:'publication-v1'});if(error)throw new StudioError('The preview changed or is not ready. Reload it and review again.',409);return reply({id:data});
  }
  if(body.action==='unpublish'){const {error}=await db.from('solution_publications').update({visible:false}).eq('job_id',id).eq('owner_id',owner);if(error)throw new StudioError('Could not unpublish.',503);return reply({ok:true});}
  throw new StudioError('Unknown action.');
}catch(error){return failure(error);}}

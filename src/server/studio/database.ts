import { createClient } from '@supabase/supabase-js';
import { StudioError } from './config';
export function database(){
  if(!process.env.SUPABASE_URL||!process.env.SUPABASE_SERVICE_ROLE_KEY)throw new StudioError('Private storage is not configured yet.',503);
  return createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
}
export async function identity(request:Request){
  const token=request.headers.get('authorization')?.replace(/^Bearer /,'');
  if(!token)throw new StudioError('Sign in to access your private workspace.',401);
  const {data,error}=await database().auth.getUser(token);
  if(error||!data.user)throw new StudioError('Your session has expired. Sign in again.',401);
  return data.user.id;
}
export async function ownerJob(owner:string,id:string){
  const {data,error}=await database().from('solution_jobs').select('*').eq('id',id).eq('owner_id',owner).maybeSingle();
  if(error)throw new StudioError('Could not load this explanation.',503);
  if(!data)throw new StudioError('Explanation not found.',404);
  return data;
}

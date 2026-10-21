import { createClient } from '@supabase/supabase-js';
import { StudioError } from './config';
import { authConfiguration } from '@/auth/config';
import { isGoogleSession, isOwnerUser } from '@/auth/policy';
import { serverAuth } from '@/auth/server';
export function database(){
  if(!process.env.SUPABASE_URL||!process.env.SUPABASE_SERVICE_ROLE_KEY)throw new StudioError('Private storage is not configured yet.',503);
  return createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
}
export async function identity(request:Request){
  if(!authConfiguration().ready)throw new StudioError('Private beta authentication is not configured yet.',503);
  const token=request.headers.get('authorization')?.replace(/^Bearer /,'');
  const auth=token?database():await serverAuth();
  const {data,error}=await auth.auth.getUser(token||undefined);
  if(error||!data.user)throw new StudioError('Your session has expired. Sign in again.',401);
  const {data:verified,error:claimsError}=await auth.auth.getClaims(token||undefined);
  if(claimsError||!isOwnerUser(data.user)||!isGoogleSession(verified?.claims))throw new StudioError('Access is restricted. Please join the waitlist.',403);
  return data.user.id;
}
export async function ownerJob(owner:string,id:string){
  const {data,error}=await database().from('solution_jobs').select('*').eq('id',id).eq('owner_id',owner).maybeSingle();
  if(error)throw new StudioError('Could not load this explanation.',503);
  if(!data)throw new StudioError('Explanation not found.',404);
  return data;
}

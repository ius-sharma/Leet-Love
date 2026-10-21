import { createHash } from 'node:crypto';
import { z } from 'zod';
import { waitlistSchema } from '@/auth/waitlist';
import { sameOrigin } from '@/auth/config';
import { database } from '@/server/studio/database';
import { StudioError } from '@/server/studio/config';
import { readBody } from '@/server/studio/request';
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
export async function POST(request:Request){
  if(!sameOrigin(request))return reply({error:'Request origin rejected.'},403);
  try{
    const input=waitlistSchema.parse(await readBody(request,3000));
    if(input.website)return reply({error:'Please leave the website field empty.'},400);
    if(process.env.LEETLOVE_WAITLIST_ENABLED!=='true')return reply({error:'The waitlist is not open yet. Please come back soon.'},503);
    const emailHash=createHash('sha256').update(input.email).digest('hex');
    const {data,error}=await database().rpc('join_leetlove_waitlist',{p_email:input.email,p_email_hash:emailHash});
    if(error)return reply({error:'We could not save your place. Please try again later.'},503);
    if(data==='limited')return reply({error:'Too many requests. Please try again later.'},429);
    if(data!=='saved')return reply({error:'We could not save your place. Please try again later.'},503);
    // Identical response for new and existing entries prevents email enumeration.
    return reply({ok:true,message:'Your place is saved. Joining the waitlist does not create an account.'});
  }catch(error){return reply({error:error instanceof z.ZodError?'Enter a valid email and agree to join the waitlist.':error instanceof StudioError?error.message:'The waitlist is temporarily unavailable.'},error instanceof StudioError?error.status:error instanceof z.ZodError?400:503);}
}

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { authConfiguration } from './config';
import { isGoogleSession, isOwnerUser } from './policy';
import { redirect } from 'next/navigation';
import { cache } from 'react';
export async function serverAuth(readOnly=false) {
  const config=authConfiguration();if(!config.ready)throw Error('Authentication is not configured.');
  const store=await cookies();
  return createServerClient(config.url,config.key,{
    cookieOptions:{sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/'},
    cookies:{getAll:()=>store.getAll(),setAll(items){if(!readOnly)for(const {name,value,options} of items)store.set(name,value,options);}},
  });
}
export const requireOwnerPage=cache(async()=>{
  if(!authConfiguration().ready)redirect('/login?notice=setup');
  let user,claims;
  try{const auth=await serverAuth(true);const result=await auth.auth.getUser();user=result.error?null:result.data.user;
    if(user){const verified=await auth.auth.getClaims();claims=verified.error?null:verified.data?.claims;}
  }catch{redirect('/login?notice=retry');}
  if(!user)redirect('/login');
  if(!isOwnerUser(user)||!isGoogleSession(claims))redirect('/waitlist?notice=restricted');
  return user;
});

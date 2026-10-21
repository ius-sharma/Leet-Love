import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { authConfiguration } from './auth/config';
import { isGoogleSession, isOwnerUser } from './auth/policy';

export async function proxy(request: NextRequest) {
  let response=NextResponse.next({request});
  const privatePage=/^\/(arrays|problems|learn|create|s)(\/|$)/.test(request.nextUrl.pathname);
  const redirect=(path:string)=>{
    const next=NextResponse.redirect(new URL(path,request.url));
    for(const cookie of response.cookies.getAll())next.cookies.set(cookie);
    next.headers.set('Cache-Control','private, no-store');return next;
  };
  const config=authConfiguration();
  if(!config.ready)return privatePage?redirect('/login?notice=setup'):response;
  const auth=createServerClient(config.url,config.key,{
    cookieOptions:{sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/'},
    cookies:{getAll:()=>request.cookies.getAll(),setAll(items){
      for(const {name,value} of items)request.cookies.set(name,value);
      response=NextResponse.next({request});
      for(const {name,value,options} of items)response.cookies.set(name,value,options);
    }},
  });
  try {
    const {data,error}=await auth.auth.getUser();
    if(!data.user||error){if(privatePage){const next=encodeURIComponent(request.nextUrl.pathname+request.nextUrl.search);return redirect(`/login?next=${next}`);}return response;}
    const {data:verified,error:claimsError}=await auth.auth.getClaims();
    if(claimsError||!isOwnerUser(data.user)||!isGoogleSession(verified?.claims)){
      await auth.auth.signOut({scope:'local'});return redirect('/waitlist?notice=restricted');
    }
    if(['/login','/signup'].includes(request.nextUrl.pathname))return redirect('/arrays');
    response.headers.set('Cache-Control','private, no-store');return response;
  }catch{return privatePage?redirect('/login?notice=retry'):response;}
}
export const config={matcher:['/arrays/:path*','/problems/:path*','/learn/:path*','/create/:path*','/s/:path*','/login','/signup']};

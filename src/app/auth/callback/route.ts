import { NextResponse } from 'next/server';
import { authConfiguration, siteOrigin } from '@/auth/config';
import { isGoogleSession, isOwnerUser, safeNext } from '@/auth/policy';
import { serverAuth } from '@/auth/server';
export async function GET(request:Request){
  const origin=siteOrigin(request),url=new URL(request.url),code=url.searchParams.get('code');
  const finish=(path:string)=>{const res=NextResponse.redirect(origin+path);res.headers.set('Cache-Control','private, no-store');res.headers.set('Referrer-Policy','no-referrer');return res;};
  if(!authConfiguration().ready)return finish('/login?notice=setup');
  if(!code||url.searchParams.has('error'))return finish('/waitlist?notice=oauth');
  const auth=await serverAuth();
  try{
    const {error}=await auth.auth.exchangeCodeForSession(code);if(error)return finish('/waitlist?notice=oauth');
    const {data,error:userError}=await auth.auth.getUser();
    const {data:verified,error:claimsError}=await auth.auth.getClaims();
    if(userError||claimsError||!isOwnerUser(data.user)||!isGoogleSession(verified?.claims)){
      await auth.auth.signOut({scope:'local'});return finish('/waitlist?notice=restricted');
    }
    return finish(safeNext(url.searchParams.get('next')));
  }catch{await auth.auth.signOut({scope:'local'}).catch(()=>{});return finish('/login?notice=retry');}
}

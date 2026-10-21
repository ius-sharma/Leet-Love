import { NextResponse } from 'next/server';
import { authConfiguration, sameOrigin, siteOrigin } from '@/auth/config';
import { isOwnerEmail, safeNext } from '@/auth/policy';
import { serverAuth } from '@/auth/server';
export async function POST(request:Request){
  if(!sameOrigin(request))return new Response('Request origin rejected.',{status:403});
  const origin=siteOrigin(request),form=await request.formData();
  if(!isOwnerEmail(form.get('email')))return NextResponse.redirect(`${origin}/waitlist?notice=restricted`,303);
  if(!authConfiguration().ready)return NextResponse.redirect(`${origin}/login?notice=setup`,303);
  try{
    const auth=await serverAuth(),callback=new URL('/auth/callback',origin);callback.searchParams.set('next',safeNext(form.get('next')));
    const {data,error}=await auth.auth.signInWithOAuth({provider:'google',options:{redirectTo:callback.toString(),skipBrowserRedirect:true,queryParams:{prompt:'select_account'}}});
    if(error||!data.url)throw Error();
    const response=NextResponse.redirect(data.url,303);response.headers.set('Cache-Control','no-store');return response;
  }catch{return NextResponse.redirect(`${origin}/login?notice=retry`,303);}
}

import { NextResponse } from 'next/server';
import { authConfiguration, sameOrigin, siteOrigin } from '@/auth/config';
import { serverAuth } from '@/auth/server';
export async function POST(request:Request){
  if(!sameOrigin(request))return new Response('Request origin rejected.',{status:403});
  if(authConfiguration().ready){const auth=await serverAuth();await auth.auth.signOut({scope:'local'});}
  const response=NextResponse.redirect(`${siteOrigin(request)}/login?notice=signed-out`,303);response.headers.set('Cache-Control','no-store');return response;
}

export function authConfiguration() {
  return { url:process.env.SUPABASE_URL??'', key:process.env.SUPABASE_ANON_KEY??'',
    ready:process.env.LEETLOVE_AUTH_ENABLED==='true' && !!process.env.SUPABASE_URL && !!process.env.SUPABASE_ANON_KEY };
}
export function siteOrigin(request: Request): string {
  // Next dev may normalize request.url to localhost while the browser uses 127.0.0.1.
  // Only accept a direct loopback Host locally; never trust forwarded hosts for OAuth.
  let localOrigin='';
  if(process.env.NODE_ENV==='development'){
    const direct=new URL(`http://${request.headers.get('host')||new URL(request.url).host}`);
    if(['127.0.0.1','localhost'].includes(direct.hostname))localOrigin=direct.origin;
  }
  const origin=process.env.AUTH_SITE_URL || localOrigin;
  if(!origin)throw Error('Authentication site URL is missing.');
  const parsed=new URL(origin);
  if(parsed.protocol!=='https:' && !(process.env.NODE_ENV==='development' && parsed.protocol==='http:' && ['127.0.0.1','localhost'].includes(parsed.hostname)))throw Error('Invalid authentication origin.');
  return parsed.origin;
}
export function sameOrigin(request: Request): boolean {
  const origin=request.headers.get('origin');
  try{return !!origin && origin===siteOrigin(request);}catch{return false;}
}

import test from 'node:test';
import assert from 'node:assert/strict';
import { isOwnerEmail, isOwnerUser, isGoogleSession, safeNext, OWNER_EMAIL } from '../src/auth/policy.ts';
import { waitlistSchema } from '../src/auth/waitlist.ts';
import { sameOrigin, siteOrigin } from '../src/auth/config.ts';
const owner={email:OWNER_EMAIL,email_confirmed_at:'2026-10-21T00:00:00Z',identities:[{provider:'google',identity_data:{email:OWNER_EMAIL,email_verified:true}}]};
test('only the exact owner email is accepted, without Gmail alias expansion',()=>{
  assert.equal(isOwnerEmail('  SHARMAEDITZAYUSH@GMAIL.COM '),true);
  for(const value of ['other@gmail.com','sharmaeditzayush+beta@gmail.com','sharma.editzayush@gmail.com','sharmaeditzayush@gmail.com.evil',null,{},''])assert.equal(isOwnerEmail(value),false);
});
test('Google identity, its verified email, and account confirmation are mandatory',()=>{
  assert.equal(isOwnerUser(owner),true);
  for(const user of [null,{...owner,email:'other@gmail.com'},{...owner,email_confirmed_at:undefined},{...owner,is_anonymous:true},{...owner,identities:[]},{...owner,identities:[{provider:'email',identity_data:owner.identities[0].identity_data}]},{...owner,identities:[{provider:'google',identity_data:{email:'other@gmail.com',email_verified:true}}]},{...owner,identities:[{provider:'google',identity_data:{email:OWNER_EMAIL,email_verified:false}}]}])assert.equal(isOwnerUser(user),false);
});
test('password sessions and user metadata cannot substitute for Google OAuth',()=>{
  assert.equal(isGoogleSession({amr:[{method:'oauth',timestamp:123}]}),true);
  for(const claims of [null,{}, {amr:[{method:'password'}]}, {amr:'oauth'}, {user_metadata:{provider:'google'}}, {amr:[null,'oauth',{}]}])assert.equal(isGoogleSession(claims),false);
});
test('return destinations cannot redirect away from the learning workspace',()=>{
  assert.equal(safeNext('/arrays/maximum'),'/arrays/maximum');assert.equal(safeNext('/problems?difficulty=Easy'),'/problems?difficulty=Easy');
  for(const path of ['https://evil.test','//evil.test','/\\evil.test','/%2f%2fevil.test','/auth/logout','/arrays/../login','/waitlist',null,'/arrays\r\nLocation: evil'])assert.equal(safeNext(path),'/arrays');
});
test('waitlist requires a real email shape and explicit consent',()=>{
  assert.equal(waitlistSchema.parse({email:'  Person@Example.com ',consent:true}).email,'person@example.com');
  for(const value of [{email:'invalid',consent:true},{email:'a@b.com',consent:false},{email:'a@b.com'},{email:'a@b.com',consent:'true'}])assert.equal(waitlistSchema.safeParse(value).success,false);
});
test('local origin uses the direct loopback host; production ignores forwarded hosts',()=>{
  const previousMode=process.env.NODE_ENV,previousSite=process.env.AUTH_SITE_URL;
  try{
    Object.assign(process.env,{NODE_ENV:'development'});delete process.env.AUTH_SITE_URL;
    const request=new Request('http://localhost:3010/auth/google',{headers:{host:'127.0.0.1:3010',origin:'http://127.0.0.1:3010'}});
    assert.equal(siteOrigin(request),'http://127.0.0.1:3010');assert.equal(sameOrigin(request),true);
    assert.equal(sameOrigin(new Request(request,{headers:{host:'127.0.0.1:3010',origin:'https://evil.test'}})),false);
    Object.assign(process.env,{NODE_ENV:'production'});process.env.AUTH_SITE_URL='https://leetlove.example';
    assert.equal(siteOrigin(new Request('https://internal.test',{headers:{'x-forwarded-host':'evil.test'}})),'https://leetlove.example');
    assert.equal(sameOrigin(new Request('https://internal.test',{headers:{origin:'https://evil.test'}})),false);
  }finally{
    if(previousMode===undefined)Reflect.deleteProperty(process.env,'NODE_ENV');else Object.assign(process.env,{NODE_ENV:previousMode});
    if(previousSite===undefined)delete process.env.AUTH_SITE_URL;else process.env.AUTH_SITE_URL=previousSite;
  }
});

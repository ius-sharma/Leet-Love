import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

test('PostgreSQL enforces owner-only users/sessions and private, idempotent, rate-limited waitlist',async()=>{
  const db=new PGlite();
  try{
    await db.exec(`
      create role anon; create role authenticated; create role service_role; create role supabase_auth_admin;
      create schema auth;
      create table auth.users(id uuid primary key default gen_random_uuid(),email text,raw_app_meta_data jsonb,is_anonymous boolean default false,email_confirmed_at timestamptz);
      create table auth.sessions(id uuid primary key default gen_random_uuid(),user_id uuid references auth.users(id));
      create table public.solution_jobs(id uuid);
      grant select on public.solution_jobs to authenticated;
      insert into auth.users(email,raw_app_meta_data,email_confirmed_at) values('legacy@example.com','{"provider":"google"}',now());
    `);
    for(const file of ['003_private_beta_auth.sql','004_waitlist.sql'])await db.exec(await readFile(new URL(`../db/migrations/${file}`,import.meta.url),'utf8'));
    const addUser=(email:string,provider:string)=>db.query<{id:string}>('insert into auth.users(email,raw_app_meta_data,email_confirmed_at) values($1,$2::jsonb,now()) returning id',[email,JSON.stringify({provider})]);
    await assert.rejects(addUser('student@gmail.com','google'),/private beta/);
    await assert.rejects(addUser('sharmaeditzayush@gmail.com','email'),/private beta/);
    const owner=(await addUser('sharmaeditzayush@gmail.com','google')).rows[0].id;
    await db.query('insert into auth.sessions(user_id) values($1)',[owner]);
    await assert.rejects(db.exec("insert into auth.sessions(user_id) select id from auth.users where email='legacy@example.com'"),/private beta/);
    await assert.rejects(db.query('update auth.users set email=$1 where id=$2',['other@gmail.com',owner]),/private beta/);
    const access=await db.query<{jobs:boolean;waitlist:boolean;budget:boolean;rpc:boolean}>(`select
      has_table_privilege('authenticated','public.solution_jobs','SELECT') as jobs,
      has_table_privilege('anon','public.leetlove_waitlist','SELECT') as waitlist,
      has_table_privilege('authenticated','public.leetlove_waitlist_budget','INSERT') as budget,
      has_function_privilege('anon','public.join_leetlove_waitlist(text,text)','EXECUTE') as rpc`);
    assert.deepEqual(access.rows[0],{jobs:false,waitlist:false,budget:false,rpc:false});
    const join=async(email:string,hash:string)=>(await db.query<{result:string}>('select public.join_leetlove_waitlist($1,$2) as result',[email,hash])).rows[0].result;
    const hash='a'.repeat(64);
    for(let i=0;i<3;i++)assert.equal(await join('student@example.com',hash),'saved');
    assert.equal(await join('student@example.com',hash),'limited');
    assert.equal((await db.query<{count:number}>('select count(*)::int as count from public.leetlove_waitlist')).rows[0].count,1);
    await db.exec("update public.leetlove_waitlist_budget set attempts=100 where bucket='global'");
    assert.equal(await join('new@example.com','b'.repeat(64)),'limited');
  }finally{await db.close();}
});

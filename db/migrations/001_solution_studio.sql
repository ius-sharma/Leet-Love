-- Run once in the Supabase SQL editor. All mutation RPCs are server-only.
create extension if not exists pgcrypto;
create table if not exists public.solution_jobs (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
  request_id uuid not null, problem text not null, source text not null check(octet_length(source)<=50000), source_hash text not null,
  input jsonb not null, stage text not null default 'queued' check(stage in ('queued','validating','tracing','generating','checking','ready','failed','cancelled')),
  message text not null default 'Waiting for a worker.', artifact jsonb, artifact_hash text, checkpoint jsonb,
  attempts int not null default 0, lease_token uuid, lease_until timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(owner_id,request_id)
);
create index if not exists solution_jobs_queue on public.solution_jobs(stage,created_at);
alter table public.solution_jobs enable row level security;
create policy jobs_owner_read on public.solution_jobs for select to authenticated using(auth.uid()=owner_id);
revoke all on public.solution_jobs from anon,authenticated;
grant select on public.solution_jobs to authenticated;

create table if not exists public.solution_publications (
 id uuid primary key default gen_random_uuid(), job_id uuid not null unique references public.solution_jobs(id) on delete cascade,
 owner_id uuid not null references auth.users(id) on delete cascade, artifact_hash text not null,
 payload jsonb not null, include_source boolean not null, author_name text not null,
 consent_version text not null, consented_at timestamptz not null default now(), visible boolean not null default true
);
alter table public.solution_publications enable row level security;
revoke all on public.solution_publications from anon,authenticated;

create table if not exists public.solution_reports (
 id uuid primary key default gen_random_uuid(), publication_id uuid not null references public.solution_publications(id) on delete cascade,
 reporter_id uuid not null references auth.users(id) on delete cascade, reason text not null check(length(reason) between 10 and 1000),
 created_at timestamptz not null default now(), unique(publication_id,reporter_id)
);
alter table public.solution_reports enable row level security;
revoke all on public.solution_reports from anon,authenticated;

create or replace function public.enqueue_solution(p_owner uuid,p_request uuid,p_problem text,p_source text,p_hash text,p_input jsonb)
returns uuid language plpgsql security definer set search_path=public as $$
declare found_id uuid;
begin
 perform pg_advisory_xact_lock(hashtext(p_owner::text));
 select id into found_id from solution_jobs where owner_id=p_owner and request_id=p_request;
 if found_id is not null then return found_id; end if;
 if (select count(*) from solution_jobs where owner_id=p_owner and created_at>now()-interval '24 hours')>=10 then raise exception 'Daily limit reached. Try again later.'; end if;
 if exists(select 1 from solution_jobs where owner_id=p_owner and stage in ('queued','validating','tracing','generating','checking')) then raise exception 'You already have an active explanation.'; end if;
 insert into solution_jobs(owner_id,request_id,problem,source,source_hash,input) values(p_owner,p_request,p_problem,p_source,p_hash,p_input) returning id into found_id;
 return found_id;
end $$;

create or replace function public.claim_solution()
returns setof public.solution_jobs language plpgsql security definer set search_path=public as $$
declare next_id uuid;
begin
 perform pg_advisory_xact_lock(738194);
 update solution_jobs set stage='failed',message='Worker interrupted repeatedly. Create a new revision.',lease_token=null,lease_until=null where lease_until<now() and attempts>=3 and stage in ('validating','tracing','generating','checking');
 update solution_jobs set stage='queued',lease_token=null,lease_until=null where lease_until<now() and attempts<3 and stage in ('validating','tracing','generating','checking');
 if (select count(*) from solution_jobs where lease_until>now() and stage in ('validating','tracing','generating','checking'))>=2 then return; end if;
 select id into next_id from solution_jobs where stage='queued' and attempts<3 order by created_at for update skip locked limit 1;
 if next_id is null then return; end if;
 return query update solution_jobs set stage='validating',message='Checking your submitted solution.',attempts=attempts+1,lease_token=gen_random_uuid(),lease_until=now()+interval '90 seconds',updated_at=now() where id=next_id returning *;
end $$;

create or replace function public.publish_solution(p_owner uuid,p_job uuid,p_hash text,p_include boolean,p_author text,p_consent text)
returns uuid language plpgsql security definer set search_path=public as $$
declare j solution_jobs; public_id uuid; clean_artifact jsonb;
begin
 select * into j from solution_jobs where id=p_job and owner_id=p_owner for update;
 if not found or j.stage<>'ready' or j.artifact_hash is distinct from p_hash then raise exception 'This exact version is not ready to publish.'; end if;
 if p_consent<>'publication-v1' or length(trim(p_author)) not between 1 and 60 then raise exception 'Explicit consent and a display name are required.'; end if;
 -- Do not expose the trace hash/input metadata, hidden cases, worker state or private source.
 clean_artifact=jsonb_build_object('version',j.artifact->'version','problem',j.problem,'story',j.artifact->'story','trace',j.artifact->'trace','passed',j.artifact->'passed','suiteVersion',j.artifact->'suiteVersion','createdAt',j.artifact->'createdAt');
 if p_include then clean_artifact=clean_artifact||jsonb_build_object('source',j.source); end if;
 insert into solution_publications(job_id,owner_id,artifact_hash,payload,include_source,author_name,consent_version)
 values(j.id,p_owner,p_hash,clean_artifact,p_include,trim(p_author),p_consent)
 on conflict(job_id) do update set payload=excluded.payload,include_source=excluded.include_source,author_name=excluded.author_name,consented_at=now(),visible=true
 returning id into public_id;
 return public_id;
end $$;

revoke all on function public.enqueue_solution(uuid,uuid,text,text,text,jsonb) from public,anon,authenticated;
revoke all on function public.claim_solution() from public,anon,authenticated;
revoke all on function public.publish_solution(uuid,uuid,text,boolean,text,text) from public,anon,authenticated;
grant execute on function public.enqueue_solution(uuid,uuid,text,text,text,jsonb) to service_role;
grant execute on function public.claim_solution() to service_role;
grant execute on function public.publish_solution(uuid,uuid,text,boolean,text,text) to service_role;

create or replace function public.retry_solution(p_owner uuid,p_job uuid)
returns void language plpgsql security definer set search_path=public as $$
begin
 perform pg_advisory_xact_lock(hashtext(p_owner::text));
 if exists(select 1 from solution_jobs where owner_id=p_owner and stage in ('queued','validating','tracing','generating','checking')) then raise exception 'An explanation is already active.'; end if;
 update solution_jobs set stage='queued',message='Retrying story generation from the saved trace.',lease_token=null,lease_until=null where id=p_job and owner_id=p_owner and stage='failed' and checkpoint is not null and attempts<3;
 if not found then raise exception 'No retry available.'; end if;
end $$;
revoke all on function public.retry_solution(uuid,uuid) from public,anon,authenticated;
grant execute on function public.retry_solution(uuid,uuid) to service_role;

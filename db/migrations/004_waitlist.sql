begin;
create table public.leetlove_waitlist(
  id uuid primary key default gen_random_uuid(),
  email text unique not null check(length(email)<=254 and email=lower(btrim(email))),
  consent_version text not null default 'waitlist-v1',
  created_at timestamptz not null default now()
);
alter table public.leetlove_waitlist enable row level security;
revoke all on public.leetlove_waitlist from public, anon, authenticated;
grant all on public.leetlove_waitlist to service_role;

create table public.leetlove_waitlist_budget(
  bucket text primary key,
  period timestamptz not null,
  attempts integer not null default 0
);
alter table public.leetlove_waitlist_budget enable row level security;
revoke all on public.leetlove_waitlist_budget from public, anon, authenticated;

create or replace function public.join_leetlove_waitlist(p_email text,p_email_hash text)
returns text language plpgsql security definer set search_path='' as $$
declare current_period timestamptz := date_trunc('hour',now());
begin
  if length(p_email)>254 or p_email<>lower(btrim(p_email)) or p_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
     or p_email_hash !~ '^[0-9a-f]{64}$' then raise exception 'Invalid waitlist request'; end if;
  -- The global row is locked first on every request, preventing limit races.
  insert into public.leetlove_waitlist_budget(bucket,period) values('global',current_period) on conflict do nothing;
  perform 1 from public.leetlove_waitlist_budget where bucket='global' for update;
  update public.leetlove_waitlist_budget set period=current_period,attempts=0 where bucket='global' and period<current_period;
  if (select attempts from public.leetlove_waitlist_budget where bucket='global')>=100 then return 'limited'; end if;
  update public.leetlove_waitlist_budget set attempts=attempts+1 where bucket='global';
  insert into public.leetlove_waitlist_budget(bucket,period) values(p_email_hash,current_period) on conflict do nothing;
  update public.leetlove_waitlist_budget set period=current_period,attempts=0 where bucket=p_email_hash and period<current_period;
  if (select attempts from public.leetlove_waitlist_budget where bucket=p_email_hash)>=3 then return 'limited'; end if;
  update public.leetlove_waitlist_budget set attempts=attempts+1 where bucket=p_email_hash;
  insert into public.leetlove_waitlist(email) values(p_email) on conflict(email) do nothing;
  return 'saved';
end;
$$;
revoke all on function public.join_leetlove_waitlist(text,text) from public, anon, authenticated;
grant execute on function public.join_leetlove_waitlist(text,text) to service_role;
commit;

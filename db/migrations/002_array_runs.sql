-- Run after 001_solution_studio.sql. Private, atomic quota for synchronous array runs.
create table if not exists public.array_run_budget (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  day date not null default current_date,
  runs integer not null default 0,
  lease_until timestamptz not null default now()
);
alter table public.array_run_budget enable row level security;
revoke all on public.array_run_budget from anon, authenticated;
grant all on public.array_run_budget to service_role;

create or replace function public.reserve_array_run(p_owner uuid)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  insert into array_run_budget(owner_id) values(p_owner) on conflict do nothing;
  perform 1 from array_run_budget where owner_id=p_owner for update;
  update array_run_budget set runs=0, day=current_date where owner_id=p_owner and day<>current_date;
  update array_run_budget set runs=runs+1, lease_until=now()+interval '90 seconds'
    where owner_id=p_owner and runs<30 and lease_until<=now();
  return found;
end;
$$;
revoke all on function public.reserve_array_run(uuid) from public, anon, authenticated;
grant execute on function public.reserve_array_run(uuid) to service_role;

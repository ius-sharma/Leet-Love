-- Owner-only Google auth. Apply before setting LEETLOVE_AUTH_ENABLED=true.
-- Dedicated Supabase project only: these triggers intentionally restrict its Auth.
begin;

create or replace function public.enforce_leetlove_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if lower(btrim(coalesce(new.email,''))) <> 'sharmaeditzayush@gmail.com'
     or coalesce(new.raw_app_meta_data->>'provider','') <> 'google'
     or new.is_anonymous is true then
    raise exception using errcode='42501', message='LeetLove is in private beta. Please join the waitlist.';
  end if;
  return new;
end;
$$;
revoke all on function public.enforce_leetlove_user() from public, anon, authenticated;
create trigger leetlove_owner_user before insert or update of email, raw_app_meta_data, is_anonymous
on auth.users for each row execute function public.enforce_leetlove_user();

create or replace function public.enforce_leetlove_session()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not exists(select 1 from auth.users u where u.id=new.user_id
    and lower(btrim(u.email))='sharmaeditzayush@gmail.com'
    and u.raw_app_meta_data->>'provider'='google'
    and u.email_confirmed_at is not null and u.is_anonymous is not true) then
    raise exception using errcode='42501', message='LeetLove is in private beta. Please join the waitlist.';
  end if;
  return new;
end;
$$;
revoke all on function public.enforce_leetlove_session() from public, anon, authenticated;
create trigger leetlove_owner_session before insert on auth.sessions
for each row execute function public.enforce_leetlove_session();

-- Also register this function under Authentication > Hooks > Before User Created
-- for a friendly rejection before Auth attempts the database insert.
create or replace function public.leetlove_before_user_created(event jsonb)
returns jsonb language plpgsql as $$
begin
  if lower(btrim(coalesce(event->'user'->>'email',''))) <> 'sharmaeditzayush@gmail.com'
     or coalesce(event->'user'->'app_metadata'->>'provider','') <> 'google' then
    return jsonb_build_object('error',jsonb_build_object('http_code',403,'message','LeetLove is in private beta. Please join the waitlist.'));
  end if;
  return '{}'::jsonb;
end;
$$;
revoke all on function public.leetlove_before_user_created(jsonb) from public, anon, authenticated;
grant execute on function public.leetlove_before_user_created(jsonb) to supabase_auth_admin;

-- The application performs verified owner checks and uses service_role for storage.
-- Remove the old authenticated direct-read path, including for legacy accounts.
revoke all on public.solution_jobs from authenticated;
commit;

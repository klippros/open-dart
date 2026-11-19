-- Authenticated callers cannot enter the private schema, so the summary list
-- RPC must run as its owner. The profile-stats Edge Function also needs
-- explicit column grants; service_role bypasses RLS but still needs GRANT.

create or replace function public.list_my_online_match_summaries(
  p_before_completed_at timestamptz default null,
  p_before_id uuid default null,
  p_limit integer default 30,
  p_completed_after timestamptz default null
)
returns setof public.online_match_summary
language sql
stable
security definer
set search_path = ''
as $$
  select *
  from private.list_online_match_summaries_for_user(
    (select auth.uid()),
    p_before_completed_at,
    p_before_id,
    p_limit,
    p_completed_after
  );
$$;

revoke all on function public.list_my_online_match_summaries(
  timestamptz,
  uuid,
  integer,
  timestamptz
) from public, anon;

grant execute on function public.list_my_online_match_summaries(
  timestamptz,
  uuid,
  integer,
  timestamptz
) to authenticated;

revoke all on table public.profiles from service_role;
grant select (user_id, display_name) on table public.profiles to service_role;

revoke all on table public.game_sessions from service_role;
grant select (user_id, mode, status, completed_at, payload)
  on table public.game_sessions to service_role;

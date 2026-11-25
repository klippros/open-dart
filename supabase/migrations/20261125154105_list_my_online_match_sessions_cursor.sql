-- Page list_my_online_match_sessions for full-history export. Keep
-- p_completed_after; when p_limit is null the result is unlimited at SQL
-- (PostgREST still caps rows per response).

drop function if exists public.list_my_online_match_sessions(timestamptz);

create function public.list_my_online_match_sessions(
  p_completed_after timestamptz default null,
  p_before_completed_at timestamptz default null,
  p_before_id uuid default null,
  p_limit integer default null
)
returns table (
  id uuid,
  completed_at timestamptz,
  session jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    match.id,
    coalesce(match.completed_at, match.created_at) as completed_at,
    case
      when jsonb_typeof(match.result_payload -> 'session') = 'object'
        then match.result_payload -> 'session'
      else null
    end as session
  from public.online_matches as match
  join public.online_match_players as membership
    on membership.match_id = match.id
  where membership.user_id = (select auth.uid())
    and private.online_match_is_history_row(match.status, match.ending_kind)
    and (
      p_completed_after is null
      or coalesce(match.completed_at, match.created_at) >= p_completed_after
    )
    and (
      p_before_completed_at is null
      or coalesce(match.completed_at, match.created_at) < p_before_completed_at
      or (
        coalesce(match.completed_at, match.created_at) = p_before_completed_at
        and p_before_id is not null
        and match.id < p_before_id
      )
    )
  order by coalesce(match.completed_at, match.created_at) desc, match.id desc
  limit case
    when p_limit is null then null
    else greatest(1, least(p_limit, 1000))
  end;
$$;

revoke all on function public.list_my_online_match_sessions(
  timestamptz,
  timestamptz,
  uuid,
  integer
) from public, anon;

grant execute on function public.list_my_online_match_sessions(
  timestamptz,
  timestamptz,
  uuid,
  integer
) to authenticated;

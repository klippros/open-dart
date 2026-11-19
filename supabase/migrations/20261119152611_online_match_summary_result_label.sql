-- Expose finished two-player leg scores on online match list summaries.

alter type public.online_match_summary
  add attribute result_label text;

create or replace function private.build_online_match_summary(p_match_id uuid)
returns public.online_match_summary
language sql
stable
security definer
set search_path = ''
as $$
  select
    match.id,
    match.status,
    match.play_mode,
    match.mode,
    case
      when match.mode = 'x01'
        and jsonb_typeof(match.config -> 'startScore') = 'number'
        then (match.config ->> 'startScore')::integer
      else null
    end,
    case
      when match.mode = 'claim-the-board'
        and jsonb_typeof(match.config -> 'aimMode') = 'string'
        then match.config ->> 'aimMode'
      else null
    end,
    match.legs_to_win,
    match.ending_kind,
    match.winner_user_id,
    match.creator_user_id,
    match.completed_at,
    match.created_at,
    coalesce(
      (
        select array_agg(membership.user_id order by membership.slot)
        from public.online_match_players as membership
        where membership.match_id = match.id
      ),
      '{}'::uuid[]
    ),
    coalesce(
      (
        select array_agg(coalesce(profile.display_name, 'Player') order by membership.slot)
        from public.online_match_players as membership
        left join public.profiles as profile
          on profile.user_id = membership.user_id
        where membership.match_id = match.id
      ),
      '{}'::text[]
    ),
    case
      when match.mode in ('x01', 'claim-the-board')
        and jsonb_typeof(match.result_payload -> 'session' -> 'matchProgress' -> 'legWins') = 'object'
      then (
        with ordered_players as (
          select
            membership.user_id::text as player_id,
            row_number() over (order by membership.slot) as rn
          from public.online_match_players as membership
          where membership.match_id = match.id
        ),
        pair as (
          select
            max(player_id) filter (where rn = 1) as left_id,
            max(player_id) filter (where rn = 2) as right_id,
            count(*) filter (where rn <= 2)::integer as player_count
          from ordered_players
        )
        select
          case
            when pair.player_count = 2
              and pair.left_id is not null
              and pair.right_id is not null
            then
              coalesce(
                (match.result_payload -> 'session' -> 'matchProgress' -> 'legWins' ->> pair.left_id)::integer,
                0
              )::text
              || ':'
              || coalesce(
                (match.result_payload -> 'session' -> 'matchProgress' -> 'legWins' ->> pair.right_id)::integer,
                0
              )::text
            else null
          end
        from pair
      )
      else null
    end
  from public.online_matches as match
  where match.id = p_match_id;
$$;

revoke all on function private.build_online_match_summary(uuid) from public, anon, authenticated;

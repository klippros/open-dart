-- On account deletion, close the user's waiting lobbies, leave lobbies they
-- joined, and abandon active matches for the opponent — then scrub as before.
-- Prefer driving the Durable Object first (match-server admin release); this
-- SQL path is the source of truth for the Supabase index and a safety net.

create or replace function private.release_open_matches_for_deletion(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  open_match record;
  opponent_user_id uuid;
  opponent_slot smallint;
  sealed_version bigint := 9223372036854775807;
begin
  -- Creator waiting lobbies: cancel the room for everyone.
  for open_match in
    select match.id
    from public.online_matches as match
    where match.creator_user_id = p_user_id
      and match.status = 'waiting'
  loop
    update public.online_matches as match
    set
      status = 'cancelled',
      ending_kind = 'creator_cancel',
      completed_at = coalesce(match.completed_at, now()),
      index_version = sealed_version,
      updated_at = now()
    where match.id = open_match.id
      and match.status = 'waiting';

    delete from public.online_match_occupancy as occupancy
    where occupancy.match_id = open_match.id;

    update public.online_match_invites as invite
    set
      status = 'superseded',
      resolved_at = coalesce(invite.resolved_at, now())
    where invite.match_id = open_match.id
      and invite.status = 'pending';
  end loop;

  -- Joiner waiting lobbies: leave without closing the room.
  for open_match in
    select player.match_id
    from public.online_match_players as player
    join public.online_matches as match
      on match.id = player.match_id
    where player.user_id = p_user_id
      and match.status = 'waiting'
      and match.creator_user_id is distinct from p_user_id
  loop
    delete from public.online_match_players as player
    where player.match_id = open_match.match_id
      and player.user_id = p_user_id;

    delete from public.online_match_occupancy as occupancy
    where occupancy.user_id = p_user_id
      and occupancy.match_id = open_match.match_id;

    update public.online_matches as match
    set
      index_version = least(match.index_version + 1, sealed_version),
      updated_at = now()
    where match.id = open_match.match_id
      and match.status = 'waiting';
  end loop;

  -- Active matches: abandon so the opponent wins.
  for open_match in
    select player.match_id, player.slot
    from public.online_match_players as player
    join public.online_matches as match
      on match.id = player.match_id
    where player.user_id = p_user_id
      and match.status = 'active'
  loop
    select membership.user_id, membership.slot
    into opponent_user_id, opponent_slot
    from public.online_match_players as membership
    where membership.match_id = open_match.match_id
      and membership.user_id is distinct from p_user_id
    limit 1;

    update public.online_match_players as player
    set abandoned_at = coalesce(player.abandoned_at, now())
    where player.match_id = open_match.match_id
      and player.user_id = p_user_id;

    if opponent_user_id is not null then
      update public.online_matches as match
      set
        status = 'completed',
        ending_kind = 'abandon',
        winner_user_id = opponent_user_id,
        winner_slot = opponent_slot,
        completed_at = coalesce(match.completed_at, now()),
        started_at = coalesce(match.started_at, match.created_at),
        result_payload = coalesce(
          match.result_payload,
          jsonb_build_object('winnerUserId', opponent_user_id)
        ),
        index_version = sealed_version,
        updated_at = now()
      where match.id = open_match.match_id
        and match.status = 'active';
    else
      -- Solo active row should not happen; cancel rather than leave it open.
      update public.online_matches as match
      set
        status = 'cancelled',
        ending_kind = 'mutual_cancel',
        completed_at = coalesce(match.completed_at, now()),
        started_at = coalesce(match.started_at, match.created_at),
        index_version = sealed_version,
        updated_at = now()
      where match.id = open_match.match_id
        and match.status = 'active';
    end if;

    delete from public.online_match_occupancy as occupancy
    where occupancy.match_id = open_match.match_id;
  end loop;

  delete from public.online_match_occupancy as occupancy
  where occupancy.user_id = p_user_id;
end;
$$;

revoke all on function private.release_open_matches_for_deletion(uuid)
  from public, anon, authenticated;

grant execute on function private.release_open_matches_for_deletion(uuid) to service_role;

create or replace function private.prepare_account_deletion(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  membership record;
  display_name text;
begin
  perform private.require_service_role();

  if p_user_id is null then
    raise exception 'user id required' using errcode = '22023';
  end if;

  if not exists (select 1 from auth.users as users where users.id = p_user_id) then
    raise exception 'user not found' using errcode = 'P0002';
  end if;

  perform private.release_open_matches_for_deletion(p_user_id);

  select profile.display_name
  into display_name
  from public.profiles as profile
  where profile.user_id = p_user_id;

  for membership in
    select player.match_id, player.slot
    from public.online_match_players as player
    where player.user_id = p_user_id
  loop
    update public.online_matches as match
    set
      result_payload = private.scrub_deleted_user_from_jsonb(
        match.result_payload,
        p_user_id,
        membership.slot,
        display_name
      ),
      creator_user_id = case
        when match.creator_user_id = p_user_id then null
        else match.creator_user_id
      end,
      winner_user_id = case
        when match.winner_user_id = p_user_id then null
        else match.winner_user_id
      end,
      updated_at = now()
    where match.id = membership.match_id;

    update public.online_match_players as player
    set user_id = null
    where player.match_id = membership.match_id
      and player.slot = membership.slot;
  end loop;

  delete from public.game_sessions where user_id = p_user_id;
  delete from public.user_follows
  where follower_id = p_user_id or followee_id = p_user_id;
  delete from public.online_match_invites
  where inviter_id = p_user_id or invitee_id = p_user_id;
  delete from private.user_invite_preferences where user_id = p_user_id;
  delete from private.display_name_reports
  where reporter_user_id = p_user_id or reported_user_id = p_user_id;
  delete from private.follow_rate_limits where user_id = p_user_id;
  delete from private.invite_list_rate_limits where user_id = p_user_id;
  delete from private.invite_create_rate_limits where user_id = p_user_id;
  delete from private.profile_history_rate_limits where user_id = p_user_id;
  delete from private.profile_stats_rate_limits where user_id = p_user_id;
  delete from public.profiles where user_id = p_user_id;
end;
$$;

revoke all on function private.prepare_account_deletion(uuid)
  from public, anon, authenticated;

grant execute on function private.prepare_account_deletion(uuid) to service_role;

-- Harden account deletion: service-role gate on release, assert no open matches
-- after release, path-based scorecard scrub, drop deleted Auth users from index
-- publishes, supersede invites on abandon.

-- ---------------------------------------------------------------------------
-- Scrub: replace UUID globally (unique); set player names by path only
-- ---------------------------------------------------------------------------

create or replace function private.scrub_deleted_user_from_jsonb(
  p_payload jsonb,
  p_user_id uuid,
  p_slot smallint,
  p_display_name text
)
returns jsonb
language plpgsql
immutable
set search_path = ''
as $$
declare
  replacement_id text := 'deleted-player-' || p_slot::text;
  scrubbed jsonb;
  player jsonb;
  players jsonb := '[]'::jsonb;
  player_id text;
begin
  if p_payload is null then
    return null;
  end if;

  scrubbed := replace(p_payload::text, p_user_id::text, replacement_id)::jsonb;

  if jsonb_typeof(scrubbed -> 'session' -> 'players') = 'array' then
    for player in
      select value
      from jsonb_array_elements(scrubbed -> 'session' -> 'players')
    loop
      player_id := player ->> 'id';
      if player_id = replacement_id then
        player := player || jsonb_build_object('name', 'Deleted player');
      elsif
        p_display_name is not null
        and length(trim(p_display_name)) > 0
        and player ->> 'name' = p_display_name
      then
        -- Exact name match only (no substring replace across the payload).
        player := player || jsonb_build_object('name', 'Deleted player');
      end if;
      players := players || jsonb_build_array(player);
    end loop;

    scrubbed := jsonb_set(scrubbed, '{session,players}', players, true);
  end if;

  if jsonb_typeof(scrubbed -> 'winnerUserId') = 'string'
    and scrubbed ->> 'winnerUserId' = replacement_id
  then
    scrubbed := scrubbed - 'winnerUserId';
  end if;

  return scrubbed;
end;
$$;

revoke all on function private.scrub_deleted_user_from_jsonb(jsonb, uuid, smallint, text)
  from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Index publish: ignore players / creator / winner whose Auth user is gone
-- ---------------------------------------------------------------------------

create or replace function private.publish_online_match_index(
  p_match_id uuid,
  p_invite_token uuid,
  p_creator_user_id uuid,
  p_status text,
  p_play_mode text,
  p_mode text,
  p_config jsonb,
  p_legs_to_win integer,
  p_starting_player_slot smallint,
  p_created_at timestamptz,
  p_started_at timestamptz,
  p_completed_at timestamptz,
  p_async_started_at timestamptz,
  p_ending_kind text,
  p_winner_user_id uuid,
  p_result_payload jsonb,
  p_index_version bigint,
  p_players public.online_match_player_input[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing_version bigint;
  player public.online_match_player_input;
  resolved_winner_slot smallint;
  resolved_creator uuid;
  resolved_winner uuid;
  filtered_players public.online_match_player_input[] := array[]::public.online_match_player_input[];
begin
  perform private.require_service_role();

  if p_match_id is null or p_index_version is null or p_players is null then
    raise exception 'not allowed' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_match_id::text || ':index', 0));

  select match.index_version
  into existing_version
  from public.online_matches as match
  where match.id = p_match_id
  for update;

  if existing_version is not null and existing_version > p_index_version then
    return;
  end if;

  select coalesce(
    array_agg(player_input order by player_input.slot),
    array[]::public.online_match_player_input[]
  )
  into filtered_players
  from unnest(p_players) as player_input
  where exists (
    select 1
    from auth.users as users
    where users.id = player_input.user_id
  );

  resolved_creator := p_creator_user_id;
  if
    resolved_creator is not null
    and not exists (select 1 from auth.users as users where users.id = resolved_creator)
  then
    resolved_creator := null;
  end if;

  resolved_winner := p_winner_user_id;
  if
    resolved_winner is not null
    and not exists (select 1 from auth.users as users where users.id = resolved_winner)
  then
    resolved_winner := null;
  end if;

  resolved_winner_slot := null;
  if resolved_winner is not null then
    select player_input.slot
    into resolved_winner_slot
    from unnest(filtered_players) as player_input
    where player_input.user_id = resolved_winner
    limit 1;
  end if;

  -- Prefer an existing winner_slot when the winner Auth row is already gone.
  if resolved_winner_slot is null then
    select match.winner_slot
    into resolved_winner_slot
    from public.online_matches as match
    where match.id = p_match_id;
  end if;

  insert into public.online_matches (
    id,
    invite_token,
    creator_user_id,
    status,
    play_mode,
    mode,
    config,
    legs_to_win,
    starting_player_slot,
    created_at,
    started_at,
    completed_at,
    async_started_at,
    ending_kind,
    winner_user_id,
    winner_slot,
    result_payload,
    index_version
  )
  values (
    p_match_id,
    p_invite_token,
    resolved_creator,
    p_status,
    p_play_mode,
    p_mode,
    coalesce(p_config, '{}'::jsonb),
    p_legs_to_win,
    p_starting_player_slot,
    coalesce(p_created_at, now()),
    p_started_at,
    p_completed_at,
    p_async_started_at,
    p_ending_kind,
    resolved_winner,
    resolved_winner_slot,
    p_result_payload,
    p_index_version
  )
  on conflict (id) do update
  set
    invite_token = excluded.invite_token,
    creator_user_id = excluded.creator_user_id,
    status = excluded.status,
    play_mode = excluded.play_mode,
    mode = excluded.mode,
    config = excluded.config,
    legs_to_win = excluded.legs_to_win,
    starting_player_slot = excluded.starting_player_slot,
    created_at = excluded.created_at,
    started_at = excluded.started_at,
    completed_at = excluded.completed_at,
    async_started_at = excluded.async_started_at,
    ending_kind = excluded.ending_kind,
    winner_user_id = excluded.winner_user_id,
    winner_slot = coalesce(excluded.winner_slot, public.online_matches.winner_slot),
    result_payload = excluded.result_payload,
    index_version = excluded.index_version,
    updated_at = now();

  delete from public.online_match_players as membership
  where membership.match_id = p_match_id
    and membership.slot not in (
      select player_input.slot
      from unnest(filtered_players) as player_input
    );

  foreach player in array filtered_players loop
    insert into public.online_match_players (match_id, user_id, slot)
    values (p_match_id, player.user_id, player.slot)
    on conflict (match_id, slot) do update
    set user_id = excluded.user_id;
  end loop;

  delete from public.online_match_occupancy as occupancy
  where occupancy.match_id = p_match_id;

  if p_status in ('waiting', 'active') and cardinality(filtered_players) > 0 then
    begin
      insert into public.online_match_occupancy (user_id, match_id)
      select player_input.user_id, p_match_id
      from unnest(filtered_players) as player_input;
    exception
      when unique_violation then
        raise exception 'occupancy_conflict' using errcode = '23505';
    end;
  end if;

  if p_status in ('waiting', 'active') and cardinality(filtered_players) >= 2 then
    update public.online_match_invites as invite
    set
      status = 'accepted',
      responded_at = coalesce(invite.responded_at, now()),
      resolved_at = coalesce(invite.resolved_at, now())
    where invite.match_id = p_match_id
      and invite.status = 'pending'
      and invite.invitee_id in (
        select player_input.user_id
        from unnest(filtered_players) as player_input
        where player_input.user_id is distinct from resolved_creator
      );

    update public.online_match_invites as invite
    set
      status = 'superseded',
      resolved_at = coalesce(invite.resolved_at, now())
    where invite.match_id = p_match_id
      and invite.status = 'pending';
  elsif p_status in ('cancelled', 'completed') then
    update public.online_match_invites as invite
    set
      status = 'superseded',
      resolved_at = coalesce(invite.resolved_at, now())
    where invite.match_id = p_match_id
      and invite.status = 'pending';
  end if;
end;
$$;

revoke all on function private.publish_online_match_index(
  uuid,
  uuid,
  uuid,
  text,
  text,
  text,
  jsonb,
  integer,
  smallint,
  timestamptz,
  timestamptz,
  timestamptz,
  timestamptz,
  text,
  uuid,
  jsonb,
  bigint,
  public.online_match_player_input[]
) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Release open matches + assert clean before scrub
-- ---------------------------------------------------------------------------

create or replace function private.assert_user_has_no_open_matches(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_service_role();

  if exists (
    select 1
    from public.online_match_players as player
    join public.online_matches as match
      on match.id = player.match_id
    where player.user_id = p_user_id
      and match.status in ('waiting', 'active')
  ) or exists (
    select 1
    from public.online_match_occupancy as occupancy
    where occupancy.user_id = p_user_id
  ) then
    raise exception 'active_match'
      using errcode = 'P0001',
            hint = 'Release open matches on the match Worker, then retry prepare_account_deletion';
  end if;
end;
$$;

revoke all on function private.assert_user_has_no_open_matches(uuid)
  from public, anon, authenticated;

grant execute on function private.assert_user_has_no_open_matches(uuid) to service_role;

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
  perform private.require_service_role();

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
      index_version = least(match.index_version + 1, sealed_version - 1),
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
      update public.online_matches as match
      set
        status = 'cancelled',
        ending_kind = 'creator_cancel',
        completed_at = coalesce(match.completed_at, now()),
        started_at = coalesce(match.started_at, match.created_at),
        index_version = sealed_version,
        updated_at = now()
      where match.id = open_match.match_id
        and match.status = 'active';
    end if;

    delete from public.online_match_occupancy as occupancy
    where occupancy.match_id = open_match.match_id;

    update public.online_match_invites as invite
    set
      status = 'superseded',
      resolved_at = coalesce(invite.resolved_at, now())
    where invite.match_id = open_match.match_id
      and invite.status = 'pending';
  end loop;

  delete from public.online_match_occupancy as occupancy
  where occupancy.user_id = p_user_id;

  perform private.assert_user_has_no_open_matches(p_user_id);
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

  -- Catch a Durable Object republish that re-added the user during scrub.
  perform private.assert_user_has_no_open_matches(p_user_id);

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

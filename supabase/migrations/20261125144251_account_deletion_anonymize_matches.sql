-- Allow real Auth-user deletion while preserving anonymized online match history.
-- Terminal participant rows keep (match_id, slot); user_id may become null.
-- winner_slot preserves the result after winner_user_id is cleared.

-- ---------------------------------------------------------------------------
-- Schema: winner_slot + nullable historical identity
-- ---------------------------------------------------------------------------

alter table public.online_matches
  add column if not exists winner_slot smallint
  constraint online_matches_winner_slot_check
  check (winner_slot is null or winner_slot in (0, 1));

alter table public.online_matches
  drop constraint if exists online_matches_creator_user_id_fkey;

alter table public.online_matches
  alter column creator_user_id drop not null;

alter table public.online_matches
  add constraint online_matches_creator_user_id_fkey
  foreign key (creator_user_id) references auth.users (id) on delete set null;

alter table public.online_match_players
  drop constraint if exists online_match_players_pkey;

alter table public.online_match_players
  drop constraint if exists online_match_players_user_id_fkey;

alter table public.online_match_players
  alter column user_id drop not null;

alter table public.online_match_players
  add constraint online_match_players_user_id_fkey
  foreign key (user_id) references auth.users (id) on delete set null;

alter table public.online_match_players
  drop constraint if exists online_match_players_match_id_slot_key;

alter table public.online_match_players
  add primary key (match_id, slot);

create unique index if not exists online_match_players_match_user_unique
  on public.online_match_players (match_id, user_id)
  where user_id is not null;

-- Active / waiting matches must still point at real accounts.
create or replace function private.enforce_online_match_player_user_required()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  match_status text;
begin
  if new.user_id is not null then
    return new;
  end if;

  select match.status
  into match_status
  from public.online_matches as match
  where match.id = new.match_id;

  if match_status in ('waiting', 'active') then
    raise exception 'active online match players require a user id'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke all on function private.enforce_online_match_player_user_required()
  from public, anon, authenticated;

drop trigger if exists enforce_online_match_player_user_required
  on public.online_match_players;

create trigger enforce_online_match_player_user_required
  before insert or update of user_id
  on public.online_match_players
  for each row
  execute function private.enforce_online_match_player_user_required();

update public.online_matches as match
set winner_slot = membership.slot
from public.online_match_players as membership
where match.winner_user_id is not null
  and match.winner_slot is null
  and membership.match_id = match.id
  and membership.user_id = match.winner_user_id;

alter type public.online_match_summary
  add attribute winner_slot smallint;

alter type public.online_match_detail
  add attribute winner_slot smallint;

-- ---------------------------------------------------------------------------
-- Summary builder: deleted players + winner_slot + stable result labels
-- ---------------------------------------------------------------------------

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
        select array_agg(
          case
            when membership.user_id is null then 'Deleted player'
            else coalesce(profile.display_name, 'Player')
          end
          order by membership.slot
        )
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
            membership.slot,
            coalesce(
              membership.user_id::text,
              match.result_payload #>> array['session', 'players', membership.slot::text, 'id']
            ) as player_id,
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
    end,
    match.winner_slot
  from public.online_matches as match
  where match.id = p_match_id;
$$;

revoke all on function private.build_online_match_summary(uuid)
  from public, anon, authenticated;

create or replace function public.get_my_online_match_detail(p_match_id uuid)
returns setof public.online_match_detail
language sql
stable
security definer
set search_path = ''
as $$
  select
    summary.id,
    summary.status,
    summary.play_mode,
    summary.mode,
    summary.x01_start_score,
    summary.claim_the_board_aim_mode,
    summary.legs_to_win,
    summary.ending_kind,
    summary.winner_user_id,
    summary.creator_user_id,
    summary.completed_at,
    summary.created_at,
    summary.player_user_ids,
    summary.player_display_names,
    1,
    case
      when jsonb_typeof(match.result_payload -> 'session') = 'object'
        then private.sanitize_online_match_session(match.result_payload -> 'session')
      else null
    end,
    summary.winner_slot
  from public.online_matches as match
  cross join lateral private.build_online_match_summary(match.id) as summary
  where match.id = p_match_id
    and private.is_online_match_member(match.id)
    and private.online_match_is_history_row(match.status, match.ending_kind);
$$;

revoke all on function public.get_my_online_match_detail(uuid) from public, anon;
grant execute on function public.get_my_online_match_detail(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Publish index: conflict on (match_id, slot), set winner_slot
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

  resolved_winner_slot := null;
  if p_winner_user_id is not null then
    select player_input.slot
    into resolved_winner_slot
    from unnest(p_players) as player_input
    where player_input.user_id = p_winner_user_id
    limit 1;
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
    p_creator_user_id,
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
    p_winner_user_id,
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
    winner_slot = excluded.winner_slot,
    result_payload = excluded.result_payload,
    index_version = excluded.index_version,
    updated_at = now();

  delete from public.online_match_players as membership
  where membership.match_id = p_match_id
    and (
      p_players is null
      or membership.slot not in (
        select player_input.slot
        from unnest(coalesce(p_players, array[]::public.online_match_player_input[])) as player_input
      )
    );

  if p_players is not null then
    foreach player in array p_players loop
      insert into public.online_match_players (match_id, user_id, slot)
      values (p_match_id, player.user_id, player.slot)
      on conflict (match_id, slot) do update
      set user_id = excluded.user_id;
    end loop;
  end if;

  delete from public.online_match_occupancy as occupancy
  where occupancy.match_id = p_match_id;

  if p_status in ('waiting', 'active') and p_players is not null and cardinality(p_players) > 0 then
    begin
      insert into public.online_match_occupancy (user_id, match_id)
      select player_input.user_id, p_match_id
      from unnest(p_players) as player_input;
    exception
      when unique_violation then
        raise exception 'occupancy_conflict' using errcode = '23505';
    end;
  end if;

  if p_status in ('waiting', 'active') and p_players is not null and cardinality(p_players) >= 2 then
    update public.online_match_invites as invite
    set
      status = 'accepted',
      responded_at = coalesce(invite.responded_at, now()),
      resolved_at = coalesce(invite.resolved_at, now())
    where invite.match_id = p_match_id
      and invite.status = 'pending'
      and invite.invitee_id in (
        select player_input.user_id
        from unnest(p_players) as player_input
        where player_input.user_id <> p_creator_user_id
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
-- Account deletion helpers (service_role only)
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
begin
  if p_payload is null then
    return null;
  end if;

  scrubbed := replace(p_payload::text, p_user_id::text, replacement_id)::jsonb;

  if p_display_name is not null and length(trim(p_display_name)) > 0 then
    scrubbed := replace(scrubbed::text, p_display_name, 'Deleted player')::jsonb;
  end if;

  if jsonb_typeof(scrubbed -> 'session' -> 'players') = 'array' then
    for player in
      select value
      from jsonb_array_elements(scrubbed -> 'session' -> 'players')
    loop
      if (player ->> 'id') = replacement_id then
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
            hint = 'Finish or cancel in-progress online matches before deleting the account';
  end if;

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

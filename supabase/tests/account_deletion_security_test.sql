BEGIN;

SELECT plan(15);

SELECT ok(
  NOT has_function_privilege('anon', 'private.prepare_account_deletion(uuid)', 'EXECUTE'),
  'anonymous users cannot prepare account deletion'
);

SELECT ok(
  NOT has_function_privilege('authenticated', 'private.prepare_account_deletion(uuid)', 'EXECUTE'),
  'authenticated users cannot prepare account deletion'
);

SELECT ok(
  has_function_privilege('service_role', 'private.prepare_account_deletion(uuid)', 'EXECUTE'),
  'service_role can prepare account deletion'
);

INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
VALUES
  (
    '00000000-0000-4000-8000-000000000021',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'deleteme@example.test',
    '',
    now(),
    '{}'::jsonb,
    '{"full_name":"Delete Me"}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-4000-8000-000000000022',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'keeper@example.test',
    '',
    now(),
    '{}'::jsonb,
    '{"full_name":"Keeper"}'::jsonb,
    now(),
    now()
  );

UPDATE public.profiles
SET display_name = 'DeleteMe'
WHERE user_id = '00000000-0000-4000-8000-000000000021';

UPDATE public.profiles
SET display_name = 'Keeper'
WHERE user_id = '00000000-0000-4000-8000-000000000022';

INSERT INTO public.game_sessions (
  id,
  user_id,
  mode,
  status,
  started_at,
  completed_at,
  client_updated_at,
  payload
)
VALUES (
  '20000000-0000-4000-8000-000000000021',
  '00000000-0000-4000-8000-000000000021',
  'bob27',
  'completed',
  '2026-01-01T00:00:00.000Z',
  '2026-01-01T00:10:00.000Z',
  '2026-01-01T00:10:00.000Z',
  '{"id":"20000000-0000-4000-8000-000000000021","mode":"bob27","status":"completed","config":{},"players":[{"id":"p1","name":"DeleteMe","kind":"human"}],"visits":[],"startedAt":"2026-01-01T00:00:00.000Z","completedAt":"2026-01-01T00:10:00.000Z"}'::jsonb
);

INSERT INTO public.online_matches (
  id,
  creator_user_id,
  status,
  play_mode,
  mode,
  config,
  legs_to_win,
  starting_player_slot,
  completed_at,
  ending_kind,
  winner_user_id,
  winner_slot,
  result_payload
)
VALUES (
  '10000000-0000-4000-8000-000000000021',
  '00000000-0000-4000-8000-000000000021',
  'completed',
  'synchronous',
  'x01',
  '{"startScore":501,"doubleIn":false,"doubleOut":true}'::jsonb,
  1,
  0,
  now(),
  'checkout',
  '00000000-0000-4000-8000-000000000021',
  0,
  jsonb_build_object(
    'winnerUserId', '00000000-0000-4000-8000-000000000021',
    'session',
    '{
      "id":"scorecard-session",
      "mode":"x01",
      "config":{"startScore":501,"doubleIn":false,"doubleOut":true},
      "players":[
        {"id":"00000000-0000-4000-8000-000000000021","name":"DeleteMe","kind":"human"},
        {"id":"00000000-0000-4000-8000-000000000022","name":"Keeper","kind":"remote"}
      ],
      "visits":[
        {"visitIndex":0,"playerId":"00000000-0000-4000-8000-000000000021","darts":[],"visitScore":180}
      ],
      "status":"completed",
      "startedAt":"2026-01-01T00:00:00.000Z",
      "completedAt":"2026-01-01T00:15:00.000Z",
      "matchProgress":{
        "legsToWin":1,
        "startingPlayerIndex":0,
        "currentLeg":1,
        "legWins":{
          "00000000-0000-4000-8000-000000000021":1,
          "00000000-0000-4000-8000-000000000022":0
        }
      }
    }'::jsonb
  )
);

INSERT INTO public.online_match_players (match_id, user_id, slot)
VALUES
  (
    '10000000-0000-4000-8000-000000000021',
    '00000000-0000-4000-8000-000000000021',
    0
  ),
  (
    '10000000-0000-4000-8000-000000000021',
    '00000000-0000-4000-8000-000000000022',
    1
  );

INSERT INTO public.user_follows (follower_id, followee_id)
VALUES (
  '00000000-0000-4000-8000-000000000022',
  '00000000-0000-4000-8000-000000000021'
);

SELECT lives_ok(
  $$ select private.prepare_account_deletion('00000000-0000-4000-8000-000000000021') $$,
  'prepare_account_deletion succeeds for a terminal-match creator'
);

SELECT lives_ok(
  $$ delete from auth.users where id = '00000000-0000-4000-8000-000000000021' $$,
  'auth.users row can be deleted after prepare_account_deletion'
);

SELECT is(
  (
    select count(*)::integer
    from public.profiles
    where user_id = '00000000-0000-4000-8000-000000000021'
  ),
  0,
  'deleted account profile is removed'
);

SELECT is(
  (
    select count(*)::integer
    from public.game_sessions
    where user_id = '00000000-0000-4000-8000-000000000021'
  ),
  0,
  'deleted account practice sessions are removed'
);

SELECT is(
  (
    select count(*)::integer
    from public.user_follows
    where follower_id = '00000000-0000-4000-8000-000000000021'
       or followee_id = '00000000-0000-4000-8000-000000000021'
  ),
  0,
  'deleted account follows are removed'
);

SELECT results_eq(
  $$
    select
      creator_user_id,
      winner_user_id,
      winner_slot,
      (
        select user_id
        from public.online_match_players
        where match_id = '10000000-0000-4000-8000-000000000021'
          and slot = 0
      ),
      (
        select user_id
        from public.online_match_players
        where match_id = '10000000-0000-4000-8000-000000000021'
          and slot = 1
      )
    from public.online_matches
    where id = '10000000-0000-4000-8000-000000000021'
  $$,
  $$
    values (
      null::uuid,
      null::uuid,
      0::smallint,
      null::uuid,
      '00000000-0000-4000-8000-000000000022'::uuid
    )
  $$,
  'match history keeps the slot, clears deleted identity, and preserves the remaining player'
);

SELECT ok(
  position(
    '00000000-0000-4000-8000-000000000021'
    in coalesce(
      (
        select result_payload::text
        from public.online_matches
        where id = '10000000-0000-4000-8000-000000000021'
      ),
      ''
    )
  ) = 0,
  'scrubbed scorecard no longer contains the deleted user id'
);

SELECT ok(
  position(
    'DeleteMe'
    in coalesce(
      (
        select result_payload::text
        from public.online_matches
        where id = '10000000-0000-4000-8000-000000000021'
      ),
      ''
    )
  ) = 0,
  'scrubbed scorecard no longer contains the deleted display name'
);

SELECT set_config(
  'request.jwt.claim.sub',
  '00000000-0000-4000-8000-000000000022',
  true
);
SET LOCAL ROLE authenticated;

SELECT results_eq(
  $$
    select
      player_display_names[1],
      player_display_names[2],
      winner_slot,
      result_label
    from public.list_my_online_match_summaries(null, null, 30, null)
    where id = '10000000-0000-4000-8000-000000000021'
  $$,
  $$ values ('Deleted player', 'Keeper', 0::smallint, '1:0') $$,
  'remaining player sees Deleted player, winner_slot, and result label'
);

RESET ROLE;

INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
VALUES (
  '00000000-0000-4000-8000-000000000023',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'active@example.test',
  '',
  now(),
  '{}'::jsonb,
  '{"full_name":"Active"}'::jsonb,
  now(),
  now()
);

UPDATE public.profiles
SET display_name = 'Active'
WHERE user_id = '00000000-0000-4000-8000-000000000023';

INSERT INTO public.online_matches (
  id,
  creator_user_id,
  status,
  play_mode,
  mode,
  config,
  legs_to_win,
  starting_player_slot
)
VALUES (
  '10000000-0000-4000-8000-000000000023',
  '00000000-0000-4000-8000-000000000023',
  'waiting',
  'synchronous',
  'x01',
  '{"startScore":501,"doubleIn":false,"doubleOut":true}'::jsonb,
  1,
  0
);

INSERT INTO public.online_match_players (match_id, user_id, slot)
VALUES (
  '10000000-0000-4000-8000-000000000023',
  '00000000-0000-4000-8000-000000000023',
  0
);

SELECT lives_ok(
  $$ select private.prepare_account_deletion('00000000-0000-4000-8000-000000000023') $$,
  'prepare_account_deletion closes waiting lobbies instead of rejecting'
);

SELECT results_eq(
  $$
    select status, ending_kind
    from public.online_matches
    where id = '10000000-0000-4000-8000-000000000023'
  $$,
  $$ values ('cancelled'::text, 'creator_cancel'::text) $$,
  'waiting lobby owned by the deleted user is cancelled'
);

SELECT is_empty(
  $$
    select 1
    from public.online_match_occupancy
    where user_id = '00000000-0000-4000-8000-000000000023'
  $$,
  'occupancy for the deleted user is cleared'
);

SELECT * FROM finish();

ROLLBACK;

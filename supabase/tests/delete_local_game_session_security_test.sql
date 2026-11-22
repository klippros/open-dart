BEGIN;

SELECT plan(10);

SELECT ok(
  NOT has_function_privilege('anon', 'public.delete_local_game_session(uuid)', 'EXECUTE'),
  'anonymous users cannot delete local game sessions'
);

SELECT ok(
  has_function_privilege('authenticated', 'public.delete_local_game_session(uuid)', 'EXECUTE'),
  'authenticated users can execute delete_local_game_session'
);

SELECT ok(
  NOT (
    select prosecdef
    from pg_proc
    where oid = 'public.delete_local_game_session(uuid)'::regprocedure
  ),
  'delete_local_game_session runs as security invoker'
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
    '00000000-0000-4000-8000-000000000011',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'owner@example.test',
    '',
    now(),
    '{}'::jsonb,
    '{"full_name":"Owner"}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-4000-8000-000000000012',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'other@example.test',
    '',
    now(),
    '{}'::jsonb,
    '{"full_name":"Other"}'::jsonb,
    now(),
    now()
  );

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
VALUES
  (
    '20000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000011',
    'x01',
    'completed',
    '2026-01-01T00:00:00.000Z',
    '2026-01-01T00:10:00.000Z',
    '2026-01-01T00:10:00.000Z',
    '{
      "id":"20000000-0000-4000-8000-000000000001",
      "mode":"x01",
      "status":"completed",
      "config":{"startScore":501,"doubleIn":false,"doubleOut":true},
      "players":[{"id":"p1","name":"Owner","kind":"human"}],
      "visits":[],
      "startedAt":"2026-01-01T00:00:00.000Z",
      "completedAt":"2026-01-01T00:10:00.000Z"
    }'::jsonb
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000012',
    'x01',
    'completed',
    '2026-01-01T00:00:00.000Z',
    '2026-01-01T00:10:00.000Z',
    '2026-01-01T00:10:00.000Z',
    '{
      "id":"20000000-0000-4000-8000-000000000002",
      "mode":"x01",
      "status":"completed",
      "config":{"startScore":501,"doubleIn":false,"doubleOut":true},
      "players":[{"id":"p1","name":"Other","kind":"human"}],
      "visits":[],
      "startedAt":"2026-01-01T00:00:00.000Z",
      "completedAt":"2026-01-01T00:10:00.000Z"
    }'::jsonb
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
  result_payload
)
VALUES (
  '30000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000011',
  'completed',
  'synchronous',
  'x01',
  '{"startScore":501,"doubleIn":false,"doubleOut":true}'::jsonb,
  1,
  0,
  now(),
  'checkout',
  '00000000-0000-4000-8000-000000000011',
  '{}'::jsonb
);

INSERT INTO public.online_match_players (match_id, user_id, slot)
VALUES
  (
    '30000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000011',
    0
  ),
  (
    '30000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000012',
    1
  );

SELECT set_config(
  'request.jwt.claim.sub',
  '00000000-0000-4000-8000-000000000011',
  true
);
SET LOCAL ROLE authenticated;

SELECT is(
  public.delete_local_game_session('20000000-0000-4000-8000-000000000001'),
  true,
  'an authenticated user can delete their own local session'
);

SELECT is(
  (
    select count(*)::integer
    from public.game_sessions
    where id = '20000000-0000-4000-8000-000000000001'
      and user_id = '00000000-0000-4000-8000-000000000011'
  ),
  0,
  'the owned local session row is removed'
);

SELECT is(
  public.delete_local_game_session('20000000-0000-4000-8000-000000000002'),
  false,
  'deleting another users session returns false'
);

SELECT is(
  public.delete_local_game_session('30000000-0000-4000-8000-000000000001'),
  false,
  'an online match id returns false'
);

SELECT is(
  public.delete_local_game_session('40000000-0000-4000-8000-000000000099'),
  false,
  'a missing session id returns false'
);

RESET ROLE;

SELECT is(
  (
    select count(*)::integer
    from public.game_sessions
    where id = '20000000-0000-4000-8000-000000000002'
      and user_id = '00000000-0000-4000-8000-000000000012'
  ),
  1,
  'another users session remains after a foreign delete attempt'
);

SELECT is(
  (
    select count(*)::integer
    from public.online_matches
    where id = '30000000-0000-4000-8000-000000000001'
  ),
  1,
  'the online match row remains'
);

SELECT * FROM finish();
ROLLBACK;

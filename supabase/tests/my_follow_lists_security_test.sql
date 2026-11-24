BEGIN;

SELECT plan(16);

SELECT ok(
  NOT has_function_privilege('anon', 'public.get_my_follow_counts()', 'EXECUTE'),
  'anonymous users cannot read follow counts'
);

SELECT ok(
  NOT has_function_privilege('anon', 'public.list_my_followers(integer, text, uuid)', 'EXECUTE'),
  'anonymous users cannot list followers'
);

SELECT ok(
  NOT has_function_privilege('anon', 'public.list_my_following(integer, text, uuid)', 'EXECUTE'),
  'anonymous users cannot list following'
);

SELECT ok(
  has_function_privilege('authenticated', 'public.get_my_follow_counts()', 'EXECUTE'),
  'authenticated users can read their follow counts'
);

SELECT ok(
  has_function_privilege('authenticated', 'public.list_my_followers(integer, text, uuid)', 'EXECUTE'),
  'authenticated users can list their followers'
);

SELECT ok(
  has_function_privilege('authenticated', 'public.list_my_following(integer, text, uuid)', 'EXECUTE'),
  'authenticated users can list who they follow'
);

SELECT ok(
  NOT has_function_privilege('authenticated', 'private.get_my_follow_counts()', 'EXECUTE'),
  'authenticated users cannot call private get_my_follow_counts'
);

SELECT ok(
  NOT has_function_privilege('authenticated', 'private.list_my_followers(integer, text, uuid)', 'EXECUTE'),
  'authenticated users cannot call private list_my_followers'
);

SELECT ok(
  NOT has_function_privilege('authenticated', 'private.list_my_following(integer, text, uuid)', 'EXECUTE'),
  'authenticated users cannot call private list_my_following'
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
    '00000000-0000-4000-8000-000000000031',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'viewer@example.test',
    '',
    now(),
    '{}'::jsonb,
    '{"full_name":"Viewer"}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-4000-8000-000000000032',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'follower@example.test',
    '',
    now(),
    '{}'::jsonb,
    '{"full_name":"Follower One"}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-4000-8000-000000000033',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'followee@example.test',
    '',
    now(),
    '{}'::jsonb,
    '{"full_name":"Followee Two"}'::jsonb,
    now(),
    now()
  );

UPDATE public.profiles SET display_name = 'Viewer'
WHERE user_id = '00000000-0000-4000-8000-000000000031';
UPDATE public.profiles SET display_name = 'Follower One'
WHERE user_id = '00000000-0000-4000-8000-000000000032';
UPDATE public.profiles SET display_name = 'Followee Two'
WHERE user_id = '00000000-0000-4000-8000-000000000033';

SELECT set_config(
  'request.jwt.claim.sub',
  '00000000-0000-4000-8000-000000000032',
  true
);
SET LOCAL ROLE authenticated;

SELECT lives_ok(
  $$ select public.follow_user('00000000-0000-4000-8000-000000000031') $$,
  'follower can follow the viewer'
);

RESET ROLE;

SELECT set_config(
  'request.jwt.claim.sub',
  '00000000-0000-4000-8000-000000000031',
  true
);
SET LOCAL ROLE authenticated;

SELECT lives_ok(
  $$ select public.follow_user('00000000-0000-4000-8000-000000000033') $$,
  'viewer can follow the followee'
);

SELECT is(
  (public.get_my_follow_counts()).follower_count,
  1,
  'viewer sees one follower'
);

SELECT is(
  (public.get_my_follow_counts()).following_count,
  1,
  'viewer sees one following'
);

SELECT is(
  (
    select array_agg(entry.display_name order by entry.display_name)
    from public.list_my_followers(50, null, null) as entry
  ),
  array['Follower One']::text[],
  'viewer lists their followers by display name'
);

SELECT is(
  (
    select array_agg(entry.display_name order by entry.display_name)
    from public.list_my_following(50, null, null) as entry
  ),
  array['Followee Two']::text[],
  'viewer lists who they follow by display name'
);

SELECT throws_ok(
  $$ select * from public.list_my_followers(50, 'Follower One', null) $$,
  '22023',
  'invalid cursor',
  'partial follower list cursors are rejected'
);

SELECT finish();

ROLLBACK;

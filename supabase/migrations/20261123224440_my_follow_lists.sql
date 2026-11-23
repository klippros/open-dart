-- Own-profile follower/following counts and paginated lists.

create type public.my_follow_counts as (
  follower_count integer,
  following_count integer
);

create type public.my_follow_list_entry as (
  user_id uuid,
  display_name text
);

create or replace function private.get_my_follow_counts()
returns public.my_follow_counts
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := private.require_authenticated_user();
  result public.my_follow_counts;
begin
  select
    (
      select count(*)::integer
      from public.user_follows as follow
      where follow.followee_id = caller
    ),
    (
      select count(*)::integer
      from public.user_follows as follow
      where follow.follower_id = caller
    )
  into result;

  return result;
end;
$$;

revoke all on function private.get_my_follow_counts() from public, anon, authenticated;

create or replace function public.get_my_follow_counts()
returns public.my_follow_counts
language sql
security definer
set search_path = ''
as $$
  select * from private.get_my_follow_counts();
$$;

revoke all on function public.get_my_follow_counts() from public, anon;
grant execute on function public.get_my_follow_counts() to authenticated;

create or replace function private.list_my_followers(
  p_limit integer default 50,
  p_after_display_name text default null,
  p_after_user_id uuid default null
)
returns setof public.my_follow_list_entry
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := private.require_authenticated_user();
  page_limit integer := least(greatest(coalesce(p_limit, 50), 1), 50);
  cursor_complete boolean :=
    (p_after_display_name is null) = (p_after_user_id is null);
begin
  if not cursor_complete then
    raise exception 'invalid cursor' using errcode = '22023';
  end if;

  if not private.consume_invite_list_rate_limit(caller, 60, 60) then
    raise exception 'rate limited' using errcode = '54000';
  end if;

  return query
  select
    follow.follower_id as user_id,
    profile.display_name
  from public.user_follows as follow
  join public.profiles as profile
    on profile.user_id = follow.follower_id
  where follow.followee_id = caller
    and (
      p_after_user_id is null
      or lower(profile.display_name) > lower(p_after_display_name)
      or (
        lower(profile.display_name) = lower(p_after_display_name)
        and follow.follower_id > p_after_user_id
      )
    )
  order by
    lower(profile.display_name) asc,
    follow.follower_id asc
  limit page_limit;
end;
$$;

revoke all on function private.list_my_followers(integer, text, uuid)
  from public, anon, authenticated;

create or replace function public.list_my_followers(
  p_limit integer default 50,
  p_after_display_name text default null,
  p_after_user_id uuid default null
)
returns setof public.my_follow_list_entry
language sql
security definer
set search_path = ''
as $$
  select *
  from private.list_my_followers(p_limit, p_after_display_name, p_after_user_id);
$$;

revoke all on function public.list_my_followers(integer, text, uuid)
  from public, anon;
grant execute on function public.list_my_followers(integer, text, uuid)
  to authenticated;

create or replace function private.list_my_following(
  p_limit integer default 50,
  p_after_display_name text default null,
  p_after_user_id uuid default null
)
returns setof public.my_follow_list_entry
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := private.require_authenticated_user();
  page_limit integer := least(greatest(coalesce(p_limit, 50), 1), 50);
  cursor_complete boolean :=
    (p_after_display_name is null) = (p_after_user_id is null);
begin
  if not cursor_complete then
    raise exception 'invalid cursor' using errcode = '22023';
  end if;

  if not private.consume_invite_list_rate_limit(caller, 60, 60) then
    raise exception 'rate limited' using errcode = '54000';
  end if;

  return query
  select
    follow.followee_id as user_id,
    profile.display_name
  from public.user_follows as follow
  join public.profiles as profile
    on profile.user_id = follow.followee_id
  where follow.follower_id = caller
    and (
      p_after_user_id is null
      or lower(profile.display_name) > lower(p_after_display_name)
      or (
        lower(profile.display_name) = lower(p_after_display_name)
        and follow.followee_id > p_after_user_id
      )
    )
  order by
    lower(profile.display_name) asc,
    follow.followee_id asc
  limit page_limit;
end;
$$;

revoke all on function private.list_my_following(integer, text, uuid)
  from public, anon, authenticated;

create or replace function public.list_my_following(
  p_limit integer default 50,
  p_after_display_name text default null,
  p_after_user_id uuid default null
)
returns setof public.my_follow_list_entry
language sql
security definer
set search_path = ''
as $$
  select *
  from private.list_my_following(p_limit, p_after_display_name, p_after_user_id);
$$;

revoke all on function public.list_my_following(integer, text, uuid)
  from public, anon;
grant execute on function public.list_my_following(integer, text, uuid)
  to authenticated;

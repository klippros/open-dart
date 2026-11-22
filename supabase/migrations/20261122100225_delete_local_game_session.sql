-- Delete one local/practice game_sessions row for the authenticated caller only.
-- security invoker keeps the existing DELETE RLS policy as a second ownership check.
-- Online matches live in online_matches and cannot be deleted through this function.

create or replace function public.delete_local_game_session(session_id uuid)
returns boolean
language plpgsql
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  deleted_count integer;
begin
  if actor_id is null then
    raise exception 'not_authenticated'
      using errcode = '42501';
  end if;

  delete from public.game_sessions as session
  where session.user_id = actor_id
    and session.id = session_id;

  get diagnostics deleted_count = row_count;

  return deleted_count > 0;
end;
$$;

revoke all on function public.delete_local_game_session(uuid) from public, anon, authenticated;
grant execute on function public.delete_local_game_session(uuid) to authenticated;

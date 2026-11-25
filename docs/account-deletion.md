# Account deletion runbook (opendart.app)

Internal operator checklist. Account deletion is not available in the app UI.
Users email `opendart@klippros.com`. Aim to respond within 30 days.

## Before you start

1. Confirm the request is about Open Dart (`opendart.app`), not another Klippros
   product.
2. Verify identity in a proportionate way. Prefer a message from the email
   address on the account. Do **not** require the person to sign back into the
   app if that email evidence is enough.
3. Apply migrations through
   `20261125161702_harden_account_deletion_release` on the project before using
   this procedure.

## Deletion steps

Run these against production with the **service role**. Always release live
Durable Objects first. Do not skip that step or ignore a non-2xx response —
SQL prepare alone can race a live lobby republish.

1. Look up the Auth user by email in the Supabase dashboard (Authentication →
   Users) and copy the user id.
2. Release open matches on the match Worker (service role bearer):

   ```bash
   curl -sS -X POST "$MATCH_SERVER_URL/v1/admin/users/<user-uuid>/release-matches" \
     -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
   ```

   Expect HTTP **200** and `"failed":[]`. This cancels waiting lobbies they
   created, leaves lobbies they joined, and abandons active matches (opponent
   wins). If the status is **409** (or any non-2xx), fix the failed match ids
   and retry this step before continuing.

3. In the SQL editor (service role), run:

   ```sql
   select private.prepare_account_deletion('<user-uuid>'::uuid);
   ```

   This force-closes any leftover waiting/active index rows, asserts the user
   has no open membership/occupancy, scrubs scorecards, nulls historical
   identity links (keeps `winner_slot`), and deletes profile, private
   `game_sessions`, follows, invites, invite preferences, display-name reports,
   and rate-limit rows. If it raises `active_match`, repeat step 2 and retry.

4. Confirm nothing open remains:

   ```sql
   select match.id, match.status
   from public.online_match_players as player
   join public.online_matches as match on match.id = player.match_id
   where player.user_id = '<user-uuid>'::uuid
     and match.status in ('waiting', 'active');

   select match_id
   from public.online_match_occupancy
   where user_id = '<user-uuid>'::uuid;
   ```

   Both should return zero rows.

5. Delete the Auth user with the Supabase Admin API or dashboard
   **Delete user** action so email and Google identity are removed.
6. Spot-check as a remaining opponent (or with service-role SQL):
   - Match summary shows `Deleted player`
   - Abandoned matches show the opponent as winner
   - `winner_slot` still reflects the result
   - Scorecard JSON does not contain the deleted email, display name, or user
     uuid
   - Profile / profile-stats for the deleted user id no longer resolve
7. Reply to the requester confirming completion. Keep only the minimum audit
   note you need (request date, user id, completion date). Do not keep a copy
   of their email content longer than necessary for that audit.

## What we promise in the Privacy Policy

- Auth identity and private account data are deleted.
- Open lobbies are closed or left; in-progress matches are abandoned for the
  opponent.
- Finished online matches remain for the opponent as “Deleted player”.
- An opponent may still recognize who they played; retained results are
  pseudonymous and kept for that history, subject to the right to object.

## Test coverage

`supabase/tests/account_deletion_security_test.sql` covers prepare + Auth
delete, scrubbing, remaining-player summary/`winner_slot`, and closing a
waiting lobby on deletion. Match-server tests cover Durable Object
cancel/leave/abandon release and admin hard-fail on partial release.

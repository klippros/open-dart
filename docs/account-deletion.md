# Account deletion runbook (opendart.app)

Internal operator checklist. Account deletion is not available in the app UI.
Users email `opendart@klippros.com`. Aim to respond within 30 days.

## Before you start

1. Confirm the request is about Open Dart (`opendart.app`), not another Klippros
   product.
2. Verify identity in a proportionate way. Prefer a message from the email
   address on the account. Do **not** require the person to sign back into the
   app if that email evidence is enough.
3. Ask them to finish or cancel any in-progress online match. The database
   helper rejects deletion while a waiting/active match or occupancy row exists.
4. Apply migration `20261125144251_account_deletion_anonymize_matches` on the
   project before using this procedure.

## Deletion steps

Run these against the production Supabase project with the **service role**.

1. Look up the Auth user by email in the Supabase dashboard (Authentication →
   Users) and copy the user id.
2. In the SQL editor (service role), run:

   ```sql
   select private.prepare_account_deletion('<user-uuid>'::uuid);
   ```

   This scrubs the user id and display name from stored online scorecards,
   nulls historical `online_match_players.user_id` / creator / winner links,
   keeps `winner_slot`, and deletes profile, private `game_sessions`, follows,
   invites, invite preferences, display-name reports, and rate-limit rows.

3. Delete the Auth user with the Supabase Admin API or dashboard
   **Delete user** action so email and Google identity are removed.
4. Spot-check as a remaining opponent (or with service-role SQL):
   - Match summary shows `Deleted player`
   - `winner_slot` still reflects the result
   - Scorecard JSON does not contain the deleted email, display name, or user
     uuid
   - Profile / profile-stats for the deleted user id no longer resolve
5. Reply to the requester confirming completion. Keep only the minimum audit
   note you need (request date, user id, completion date). Do not keep a copy
   of their email content longer than necessary for that audit.

## If `prepare_account_deletion` raises `active_match`

Tell the user to finish or cancel the open match, or cancel it from the match
Worker / dashboard if they cannot, then retry.

## What we promise in the Privacy Policy

- Auth identity and private account data are deleted.
- Online matches remain for the opponent as “Deleted player”.
- An opponent may still recognize who they played; retained results are
  pseudonymous and kept for that history, subject to the right to object.

## Test coverage

`supabase/tests/account_deletion_security_test.sql` covers prepare + Auth
delete, scrubbing, remaining-player summary/`winner_slot`, and rejection while
a waiting match exists.

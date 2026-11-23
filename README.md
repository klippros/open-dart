# Open Dart

An open source darts scoring app that is easy to get started with.
No login required, lives in the browsers local storage by default.
When Supabase is configured, finished games can be synced between
devices too, when the user signs up. When both Supabase and a Cloudflare
match Worker are configured, signed-in players can also play online.

Pick from many fun game modes for practice and play, from classic
501 to Bob's 27 and Around the Clock.

Open Dart tracks every dart you throw so you can analyze your progress over time.

**Live:** [opendart.app](https://opendart.app)

## Development

Prerequisites: Node.js, pnpm 10+.

```bash
pnpm install
pnpm dev        # http://localhost:5173/
pnpm dev:match  # optional match Worker at http://localhost:8787
pnpm test
pnpm build
pnpm preview
```

## Contributing

See [AGENTS.md](AGENTS.md) for project conventions.

## Hosting

The example site on [opendart.app](https://opendart.app) uses Cloudflare
Pages, which rebuilds automatically when `master` updates. Optional backends
(Supabase, the `player-profile-stats` edge function, and the match Worker)
are still deployed manually. See [optional backends](docs/self-hosting.md).

- **Web only** — no env vars; anonymous local play
- **Web + Supabase** — sign-in and sync of completed local games
- **Web + Supabase + edge function** — public profile practice stats
- **Web + Supabase + match Worker** — online two-player matches

Online play needs **both** Supabase and the Worker (`wrangler deploy` plus
`SUPABASE_URL`, `SUPABASE_JWT_SECRET`, and `SUPABASE_SERVICE_ROLE_KEY`
secrets). Profile stats need
`supabase functions deploy player-profile-stats` (and
`PROFILE_STATS_ALLOWED_ORIGINS`).

---

© 2026 Klippros Studios AB · [GitHub](https://github.com/klippros/open-dart)

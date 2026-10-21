# Python leaderboard deployment

## Railway configuration

Deploy this GitHub repository with the included Dockerfile and `railway.json`. Add a PostgreSQL service to the same project. Review the provider's quoted plan and usage costs before provisioning.

Set these variables on the game/API service:

- `DATABASE_URL`: reference the PostgreSQL service's connection URL through Railway's variable editor. Never paste credentials into source control.
- `ENVIRONMENT=production`: refuses to run against an ephemeral SQLite database.
- `ALLOWED_ORIGINS=https://exploration-crusader-play.ceomo.chatgpt.site`

Railway supplies `PORT`. The container serves the Python API and bundled game on that port. Health checks use `/api/health` and test database connectivity.

## Connect the existing public game

After the Python service has a verified HTTPS domain, rebuild the existing frontend with `VITE_API_ORIGIN=https://<actual-api-domain>` and publish those assets to the existing Sites project. This is a public URL, not a secret. It must be the service origin without `/api`.

For same-origin deployments, omit `VITE_API_ORIGIN`; `/api` continues to work as before. This configuration does not change the current live game until the frontend is rebuilt and deployed.

## Verify before declaring the leaderboard live

1. `/api/health` returns `{"status":"ok"}`.
2. `/api/leaderboard` returns JSON.
3. A real flight from the public game obtains a run ID and submits its score.
4. Reloading the leaderboard shows the submitted entry.
5. Restarting the API service preserves that entry in PostgreSQL.
6. Duplicate submissions return 409; disallowed browser origins fail CORS preflight.

The leaderboard is a casual, client-reported scoreboard. CORS limits browser origins; it is not authentication or protection from direct API clients. Rate limiting, server-verified scores, moderation, migration management and database backup policy remain production follow-ups.

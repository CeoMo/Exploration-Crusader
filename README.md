# Exploration Crusader

A browser space arcade game by Mohamed Diallo, rebuilt with **React, TypeScript, Phaser and Python/FastAPI**. Fly through space, collect meteor samples, avoid black holes and submit your expedition to a persistent leaderboard.

## Stack

| Layer | Technology | Responsibility |
| --- | --- | --- |
| Interface | React + TypeScript | Menus, HUD, audio controls and leaderboard |
| Game | Phaser 3 + TypeScript | Rendering, keyboard/touch input and simulation |
| API | Python + FastAPI | Expedition registration and score submissions |
| Persistence | SQLAlchemy + PostgreSQL | Stored flights and leaderboard |
| Local database | SQLite | Zero-configuration development and API tests |
| Build | Vite | Frontend development and production bundles |

The browser runs the real-time game; Python handles persistence. No Python installation is needed for players. The previous GitHub Pages demo is the legacy version. **GitHub Pages cannot host this Python backend.** This revision needs an application server and has not been deployed.

## Local development

Requires Node.js 24 and Python 3.12.

```sh
npm ci
python3 -m venv .venv
# Windows: .venv\Scripts\activate
source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.app:app --reload --port 8001
```

In another terminal:

```sh
npm run dev
```

Open http://localhost:5173. Vite proxies `/api` to Python on port 8001. SQLite creates `crusader.db` locally; it is excluded from git.

## Production build

```sh
npm run build
uvicorn backend.app:app --host 0.0.0.0 --port 8001
```

Open http://localhost:8001. FastAPI serves both the built game and `/api`, so no cross-origin configuration is needed. Re-start the server after the initial frontend build.

For PostgreSQL, set `DATABASE_URL` to `postgresql+psycopg://USER:PASSWORD@HOST:5432/DATABASE` before starting the server. Do not commit credentials.

### Docker + PostgreSQL

Copy `.env.example` to `.env`, replace the placeholder password, then run:

```sh
docker compose up --build
```

The game is available at http://localhost:8001. PostgreSQL data is stored in a named volume. The Docker/PostgreSQL path is supplied but has not yet been exercised in this workspace.

## Controls

- Arrow keys / WASD: fly. Touch players can hold the directional buttons.
- P / Escape: pause or resume with the game field focused.
- Restart: create a new expedition.
- Audio controls: mute or adjust volume.

Switching away pauses the game. Best score is stored locally. The leaderboard uses an explicit submission form after a flight ends; pilot names and scores are public. If the API is unavailable, flights continue in practice mode and cannot be submitted.

## API

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Application/database health |
| POST | `/api/runs` | Register an expedition and return its ID |
| POST | `/api/runs/{id}/score` | Submit nickname, integer score and duration once |
| GET | `/api/leaderboard` | Top 20 flights, sorted by score then duration |

Interactive documentation: `/docs`.

The API rejects malformed values, duplicate submissions, expired expeditions and basic impossible time/score combinations. **Scores are still client-reported, not cheat-proof.** Accounts, server-authoritative replay validation, rate limiting and moderation are future work before a competitive public launch. Run IDs are bearer capabilities, not user authentication. The initial schema is created at startup; adopt migrations before changing a deployed database schema.

## Validation

```sh
npm test
npm run build
python -m pytest backend/tests -q
```

Simulation tests cover frame-rate independence, bounds, diagonal speed, pause/reset, pickups, collisions and cleanup. API tests cover persistence across restarts, validation, duplicate submissions and missing expeditions. CI runs both suites and the production build.

## Structure

- `frontend/src/engine.ts`: rendering-independent typed game simulation.
- `frontend/src/Game.ts`: Phaser scene and input/rendering adapter.
- `frontend/src/main.tsx`: React interface and game lifecycle.
- `frontend/src/api.ts`: typed backend requests with timeouts.
- `backend/app.py`: application factory, data model and API routes.
- `backend/tests/`, `tests/`: API and simulation tests.
- `canvas/` and the remaining original image assets: historical prototype material, not the active entry point.

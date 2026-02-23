# Lila Game

Monorepo:
- `frontend` — React + TypeScript + Vite + Dexie + Tailwind
- `backend` — Express + TypeScript (`/api/events`, `/api/auth/telegram/webapp`, `/api/rooms`, `/health`)

## Local run
- `npm run dev` — frontend + backend
- `npm run test:all` — all tests
- `npm run build` — frontend + backend build

## Docker
- Full stack (frontend + backend): `docker compose up --build`
  - frontend: `http://localhost:8080`
  - backend: `http://localhost:3001`
- Backend image only: `docker build -f backend/Dockerfile -t lila-backend:local .`
- Frontend image only: `docker build -f frontend/Dockerfile -t lila-frontend:local .`

## Telegram Mini App
- Setup guide: `/Users/mishaivchenko/dev/lila-game-codex/docs/TELEGRAM_MINI_APP_SETUP.md`
- Required backend env: `TELEGRAM_BOT_TOKEN`, `APP_AUTH_SECRET`, `FRONTEND_WEBAPP_URL`
- Required frontend env: `VITE_API_BASE_URL`

## CI/CD
Workflow: `/Users/mishaivchenko/dev/lila-game-codex/.github/workflows/ci-cd.yml`

On each push to `main`:
1. Run tests and build.
2. Build and push Docker image to GHCR:
   - `ghcr.io/<owner>/lila-game-codex:<sha>`
   - `ghcr.io/<owner>/lila-game-codex:latest`
3. Deploy to Hugging Face Space (Docker).

Required GitHub Environment secrets (environment name: `HF_SPACE_ID`):
- `HF_TOKEN` — Hugging Face write token
- `HF_SPACE_ID` — `username/space-name` or full HF Space URL

HF free-tier note:
- Space repo rejects large/binary assets.
- During deploy, binary assets are replaced inside Space.
- On `*.hf.space`, frontend loads real `/cards` and `/field` assets from this GitHub repo (`raw.githubusercontent.com`).

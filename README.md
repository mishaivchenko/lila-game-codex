# Lila Game

Monorepo:
- `frontend` — React + TypeScript + Vite + Dexie + Tailwind
- `backend` — Express + TypeScript (`/api/events`, `/health`)

## Local run
- `npm run dev` — frontend + backend
- `npm run test:all` — all tests
- `npm run build` — frontend + backend build

## Docker
- Build: `docker build -t lila-game-codex:prod .`
- Run: `docker run --rm -p 3001:3001 lila-game-codex:prod`
- App URL: `http://localhost:3001`

Container details:
- multi-stage build
- non-root runtime user
- serves built frontend + backend API in one container

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

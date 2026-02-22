# Lila MVP

Monorepo with a mobile-first React SPA and a lightweight Express backend.

## Workspaces
- `frontend` — React + TypeScript + Vite + Dexie + Tailwind CSS
- `backend` — Express + TypeScript API for anonymous events

## Root scripts
- `npm run dev` — starts frontend and backend together
- `npm run build` — builds both workspaces
- `npm run test` — runs frontend tests
- `npm run test:backend` — runs backend tests
- `npm run test:all` — runs all tests

## Routes
- Frontend: `/`, `/setup`, `/game`, `/history`, `/settings`
- Backend: `POST /api/events`, `GET /health`

## Notes
- Local-first: frontend remains playable when backend is unavailable.
- Card files are mapped from `/cards` to cell numbers via `frontend/src/content/cardMap.json`.

## Docker (production)
- Build image: `docker build -t lila-game-codex:prod .`
- Run image: `docker run --rm -p 3001:3001 lila-game-codex:prod`
- Open app: `http://localhost:3001`

The runtime container serves:
- frontend static bundle from `frontend/dist`
- backend API on `/api/events`
- health check on `/health`

Image-size optimization in this setup:
- multi-stage build (build tools stay in builder stage)
- runtime keeps only backend production dependencies
- container runs as non-root user (`node`)

## Docker Compose (local)
- `docker compose up --build`

## CI/CD (GitHub Actions + GHCR + Fly.io/Render)
Workflow file: `.github/workflows/ci-cd.yml`

On every push to `main`, pipeline:
1. Installs dependencies, runs frontend/backend tests, and builds both workspaces.
2. Builds Docker image and pushes:
   - `ghcr.io/<owner>/lila-game-codex:<commit-sha>`
   - `ghcr.io/<owner>/lila-game-codex:latest`
3. Deploys automatically to:
   - Fly.io if `FLY_API_TOKEN` and `FLY_APP_NAME` are configured, or
   - Render if `RENDER_DEPLOY_HOOK_URL` is configured.
4. If no deploy secrets are configured, build/push still succeeds and deploy is marked as skipped.

### Required GitHub secrets
- `FLY_API_TOKEN` — Fly.io API token
- `FLY_APP_NAME` — Fly app name (for example `my-lila-app`)
- `RENDER_DEPLOY_HOOK_URL` — Render deploy hook URL (fallback deploy target)

### One-time Fly setup
1. Install Fly CLI and log in.
2. Create app once: `flyctl apps create <your-app-name>`
3. Ensure `fly.toml` exists in repo root.
4. Add required GitHub secrets.

After that, each push to `main` auto-deploys the latest image.

### Render fallback (no Fly token required)
1. Create a Web Service on Render from this repository.
2. In Render service settings, create/copy Deploy Hook URL.
3. Add `RENDER_DEPLOY_HOOK_URL` in GitHub repository secrets.
4. Push to `main` and GitHub Actions will trigger Render deploy automatically.

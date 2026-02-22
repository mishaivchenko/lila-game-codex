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

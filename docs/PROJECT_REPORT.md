# Project Report

## 1. Overview
Lila is a TypeScript monorepo for a guided Leela game experience with:
- a React + Vite SPA frontend,
- an Express + TypeScript backend,
- Telegram Mini App integration,
- Docker-based deployment for single-VPS runtime.

Main user-facing flows:
- start/resume a game session,
- move across full or short boards with snake/ladder transitions,
- read card meaning and save notes/insights,
- review journey history,
- use Telegram shell + auth and room creation/join skeleton,
- see locked "Глибока гра" teaser UX (Coming Soon).

## 2. Development History (High-Level)
The timeline below is reconstructed from `git log --first-parent` and merged feature branches.

### Phase A: MVP foundation
- `83f572d`: initial scaffold and first roll flow stabilization.
- Board gameplay model, basic movement and session lifecycle were introduced.

### Phase B: Board rendering and coordinate system
- `5d18ee3`, `7283551`, merged via `28a860b`:
  - migrated to PNG board rendering,
  - added coordinate mapping,
  - split full/short board layouts.
- `dba692d`: updated full board snake/arrow map and aligned tests.

### Phase C: Special-move visuals and animation evolution
- `2b93cb9`, `31ecef6`, `4e53738`, `7ebc7ea`:
  - V1 snake/arrow overlays,
  - visual enhancement pass.
- `8c270ee`:
  - board profiles + path definitions,
  - sequenced special-move visualization.
- `4566cce`, `03f62eb`:
  - path-based snake/ladder rendering,
  - lifecycle stabilization for transitions.

### Phase D: UX and game-flow stabilization
- `8b106db` + subsequent fixes (`6baf2c0`, `ef2873b`, `59e6d11`, `1662fcb`, `f937e5b`, `2511739`, `618126c`):
  - richer motion/UX pass,
  - startup and routing reliability fixes,
  - dev network/CORS fixes.
- Multiplayer/simple flow stabilization and setup redesign (`06d6b07`..`f00ea93`, merged via `a22bd0d`).
- `0fa0121`: auto-resume session on reload.
- `c1bfdcc`: dice timer lifecycle fix.

### Phase E: Content/insight quality and history correctness
- `2b2d7d5`, `ff8e9d9`, `fd27df9`:
  - core gameplay bugfixes,
  - snake/ladder display consistency in history/modals,
  - note validation refinements.
- `6d31108`, `f34427c`, `7c157b1`:
  - markdown support for rules/cards,
  - stepwise movement with bounce behavior,
  - settings modal and move-path display fixes.

### Phase F: Deep Mode UX
- `22ff8ca`, `a404459`, `0c86ce8`:
  - AI wall / deep mode teaser,
  - warm theme unification,
  - deep mode launch lock and teaser-only behavior.

### Phase G: Telegram Mini App + deployment track
- `7ca2236`, `eea1c6f`:
  - Telegram shell/auth context,
  - room create/join skeleton,
  - fullscreen/tunnel reliability improvements.
- `4bcadfa`, `147797b`, `13065b8`, `657808b`, `185fa2a`:
  - VPS migration infra,
  - IP-only deploy path with HTTPS-ready setup,
  - Telegram auth initData handling,
  - API base URL join fix.

### Phase H: Reliability and governance
- `1c95d9e`: test stability around timer lifecycle and Telegram signature test.
- `d10ad51`: overlay interaction lock and My Path apply bug fix.
- `01a60ae`: code health dashboard baseline (`docs/code_health_dashboard.md`, `docs/code_health_metrics.json`).

## 3. Architecture Overview

### 3.1 Frontend
Tech stack:
- React 19 + TypeScript,
- Vite 7,
- Tailwind CSS,
- Framer Motion,
- Dexie (IndexedDB persistence),
- React Router.

Primary structure (`/frontend/src`):
- `app/` routing composition (`router.tsx`),
- `pages/` route-level orchestration (`HomePage`, `GameSetupPage`, `GamePage`, `HistoryPage`, `SettingsPage`),
- `components/` reusable UI (board, modals, markdown, dice, animation settings),
- `components/lila/` board canvas and path animation renderers,
- `context/` app-level session orchestration (`GameContext`),
- `domain/` core game rule calculations (`gameEngine.ts`),
- `features/deep-mode/` isolated Deep Mode UI module,
- `features/telegram/` Telegram shell, auth and rooms modules,
- `lib/lila/` board coordinates, board profiles, movement visualization, formatting,
- `repositories/` persistence contracts and Dexie adapters,
- `content/` board/card/chakra assets and metadata.

Routing:
- BrowserRouter in `frontend/src/app/router.tsx`.
- Standard routes: `/`, `/setup`, `/game`, `/history`, `/settings`, `/deep-mode`.
- Telegram route alias: `/telegram`.

State management:
- `GameContext` + reducer for session lifecycle and move execution.
- Local UI state inside pages/components for transient UX (modals, animation phase, drafts).

Board rendering and movement:
- Cell-to-coordinate mapping via `lib/lila/mapCellToBoardPosition.ts` and board coordinate maps.
- Transition paths from board profiles (`snakePaths`, `ladderPaths`) via `getBoardTransitionPath`.
- Stepwise movement path helper: `buildStepwiseCellPath` (supports bounce path like `71 -> 72 -> 71`).
- Visual transition renderer: `LilaPathAnimation` + `AnimationRendererSnake` / `AnimationRendererLadder`.

Deep mode:
- Isolated under `features/deep-mode` with dedicated card/wall/theme/store.
- Locked teaser behavior; no runtime AI call pipeline in current implementation.

Telegram integration (frontend):
- `TelegramAppShell` wraps routes and initializes Telegram WebApp behaviors.
- `telegramWebApp.ts` centralizes environment detection and SDK access.
- Auth state in `TelegramAuthContext` and room state in `TelegramRoomsContext`.

### 3.2 Backend
Tech stack:
- Node.js + Express 5 + TypeScript,
- Zod validation.

Main modules (`/backend/src`):
- `index.ts` app factory and route mounting,
- `routes/auth.ts` Telegram WebApp auth endpoint,
- `routes/rooms.ts` room create/join endpoints,
- `routes/events.ts` event ingestion endpoint,
- `lib/telegramWebAppAuth.ts` initData signature and freshness validation,
- `lib/appToken.ts` app token generation,
- `lib/authMiddleware.ts` bearer-token gate for protected routes,
- `store/usersStore.ts` in-memory user store,
- `store/roomsStore.ts` in-memory rooms store.

API surface:
- `GET /health`,
- `POST /api/events`,
- `POST /api/auth/telegram/webapp`,
- `POST /api/rooms` (auth required),
- `GET /api/rooms/:code` (auth required).

Note on persistence:
- backend room/user persistence is currently in-memory maps (volatile across restarts), prepared as MVP scaffolding.
- PostgreSQL is provisioned in infra, but backend does not yet use a DB driver/ORM for these entities.

### 3.3 Storage & Persistence
Frontend persistence:
- Dexie database (`lila_game_db`) in `frontend/src/db/dexie.ts`.
- Tables: `sessions`, `moves`, `insights`, `settings`.
- Repository contracts decouple UI/domain from concrete storage adapters.

Data model highlights:
- sessions: current cell, board type, status, request/settings, timestamps,
- moves: from/to/dice/moveType with sequence number,
- insights: note text bound to session+cell,
- settings: animation and app-level settings.

Backend persistence:
- currently volatile in-memory stores for users and rooms.
- docker-compose includes PostgreSQL for production-readiness and future migration.

## 4. Deployment & Networking

### Runtime topology (single VPS)
Current production-oriented stack is defined by `/docker-compose.yml`:
- `caddy` (edge reverse proxy, ports 80/443),
- `frontend` (Nginx serving built React app),
- `backend` (Node API on `3001` inside Docker network),
- `postgres` (persistent volume).

Network routing (`/deploy/Caddyfile`):
- `/api/*`, `/health`, `/field/*`, `/cards/*` -> `backend:3001`,
- all other paths -> `frontend:80`.

Frontend serving:
- Nginx config (`/frontend/nginx.conf`) uses `try_files ... /index.html` for SPA fallback.

### Build/package flow
- frontend Dockerfile: multi-stage Node build -> Nginx runtime image.
- backend Dockerfile: TypeScript build stage -> slim Node runtime with production deps only.

### Telegram Mini App connectivity
- Bot menu button opens webapp URL (typically `/telegram`).
- `TelegramAppShell` fetches Telegram `initData`, posts it to backend auth endpoint.
- backend validates Telegram signature using `TELEGRAM_BOT_TOKEN`, returns app token and profile.
- protected room endpoints consume bearer app token.

### Environment and secrets
Primary runtime variables from root `.env` / deployment docs:
- `PUBLIC_URL`, `CADDY_SITE_ADDR`,
- `FRONTEND_IMAGE`, `BACKEND_IMAGE`,
- `APP_AUTH_SECRET`,
- `TELEGRAM_BOT_TOKEN`,
- `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`.

Backend expects (from compose env mapping):
- `APP_BASE_URL`,
- `FRONTEND_WEBAPP_URL`,
- DB connection vars (`DATABASE_URL`, host/port/user/password/db).

### HTTPS status
- Caddy config is HTTPS-ready.
- Domain-based automatic TLS is supported via Caddy when `CADDY_SITE_ADDR` is set to a domain and DNS is correct.
- IP-only mode can run without TLS, but Telegram Mini App production usage requires HTTPS URL.

### CI/CD
Two active workflow files:
- `/Users/mishaivchenko/dev/lila-game-codex/.github/workflows/ci-cd.yml`
  - tests + build,
  - builds/pushes monolithic image,
  - deploys to Hugging Face Space fallback.
- `/Users/mishaivchenko/dev/lila-game-codex/.github/workflows/deploy.yml`
  - builds/pushes separate frontend/backend GHCR images,
  - SSH deploy to VPS via `docker compose pull && docker compose up -d`.

Required deploy secrets (workflow-dependent):
- `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `VPS_APP_DIR`,
- `GHCR_USERNAME`, `GHCR_PAT`.

## 5. Patterns, Principles and Practices

Used patterns/approaches:
- Repository pattern:
  - `repositories/contracts/*` + Dexie implementations.
- Feature-module boundaries:
  - `features/deep-mode`, `features/telegram` isolate vertical slices.
- Domain vs rendering split:
  - game rules in `domain/gameEngine.ts`,
  - board/animation rendering in `components/lila/*` and `lib/lila/*`.
- Adapter-style boundary for Telegram SDK:
  - `telegramWebApp.ts` centralizes SDK access and mode checks.
- Config-driven board behavior:
  - board profiles and path factories for snakes/ladders.

SOLID observations:
- Strong:
  - SRP in repository adapters and utility modules,
  - DIP between app logic and persistence through contracts,
  - OCP for board profiles/theme extension.
- Weaker zones:
  - `GamePage.tsx` has high orchestration density,
  - `GameContext.tsx` combines reducer state with multiple side-effecting workflows,
  - backend store layer is simple and volatile (acceptable for MVP, not final production architecture).

## 6. Testing & Quality Gates

### Test strategy and placement
Frontend (Vitest + Testing Library):
- component tests (`components/*`, `features/*`),
- domain/unit tests (`domain/`, `lib/lila/`),
- context/page flow tests (`context/`, selected `pages/`).

Backend (Vitest + Supertest):
- `backend/test/events.test.ts`,
- `backend/test/authRooms.test.ts`.

Approximate inventory (current repo state):
- frontend test files: 24,
- backend test files: 2.

### Quality scripts
Root scripts:
- `npm run dev`,
- `npm run build`,
- `npm run test`,
- `npm run test:backend`,
- `npm run test:all`.

Workspace scripts:
- frontend: `dev`, `build`, `test`,
- backend: `dev`, `build`, `test`.

Lint/format:
- frontend has ESLint config (`/frontend/eslint.config.js`),
- no root-level lint script currently wired,
- no explicit Prettier configuration tracked in repository root.

Coverage:
- no enforced coverage threshold file is currently configured.
- practical quality gate is test pass + build pass in CI.

## 7. Known Limitations & Technical Debt
- Backend persistence gap:
  - Postgres runs in stack, but auth/rooms stores are still in-memory.
- Workflow duplication/overlap:
  - both `ci-cd.yml` and `deploy.yml` deploy pathways exist (HF + VPS); operational source-of-truth should be clarified.
- Large orchestration modules:
  - `GamePage.tsx` and `GameContext.tsx` remain high-complexity hotspots.
- Legacy/bootstrap artifacts:
  - `frontend/src/App.tsx` Vite template file is still present and unused by the app entry path.
- Lint gate incompleteness:
  - ESLint exists but is not enforced as required root CI stage.

## 8. How to Use This Report
For new contributors and future Codex sessions:
1. Read Sections 1-4 before changing architecture/deployment.
2. Keep game engine rules separate from UI rendering and platform-specific adapters.
3. For Telegram/deploy changes, validate both `ci-cd.yml` and `deploy.yml` implications.
4. Before merging significant changes, run `npm run test:all` and `npm run build`.
5. Update this file whenever architecture boundaries, deployment topology, or quality gates change.

---
Last updated: `2026-02-24`.
Maintainer note: this report should be updated alongside any significant architectural, CI/CD, storage, Telegram, or runtime-networking change.

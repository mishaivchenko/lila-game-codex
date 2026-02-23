# Telegram Mini App Setup (Lila)

This guide configures the existing Lila app as a Telegram Mini App WebApp.

## 1) Create and configure bot in BotFather

1. Open [@BotFather](https://t.me/BotFather).
2. Run `/newbot` and create bot name + username.
3. Copy the generated token and save it as `TELEGRAM_BOT_TOKEN` in backend env.
4. Run `/setmenubutton` in BotFather:
   - choose your bot,
   - type: `Web App`,
   - title: `Open Lila`,
   - URL: your deployed frontend URL (recommended `https://your-domain/telegram`).
5. Optional: configure `/setdescription` and `/setcommands` for better UX.

## 2) Environment variables

### Backend (`backend/.env`)

Use `backend/.env.example` as a template.

Required values:
- `TELEGRAM_BOT_TOKEN` — BotFather token.
- `APP_AUTH_SECRET` — secret for app token signing.
- `PORT` — backend port (default `3001`).
- `APP_BASE_URL` — public backend base URL.
- `FRONTEND_WEBAPP_URL` — deployed frontend URL used in Telegram settings.

### Frontend (`frontend/.env`)

Use `frontend/.env.example` as a template.

Required values:
- `VITE_API_BASE_URL` — backend URL (example: `https://api.your-domain.com` or `/api` behind reverse proxy).
- `VITE_TELEGRAM_BOT_NAME` — optional bot username.
- `VITE_FORCE_TELEGRAM_MODE` — local debug flag (`true/false`).

## 3) Run locally (without Docker)

From repository root:

```bash
npm install
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`

For Telegram real-device testing you need HTTPS/public URL. Use a tunnel:

```bash
ngrok http 5173
# or
cloudflared tunnel --url http://localhost:5173
```

Set tunnel URL as WebApp URL in BotFather `/setmenubutton`.

## 4) Run locally with Docker Compose

```bash
docker compose up --build
```

- Frontend served at `http://localhost:8080`
- Backend served at `http://localhost:3001`

Frontend proxies `/api/*` requests to backend container.

## 5) Expected flow

1. User opens bot and taps `Open Lila` menu button.
2. Telegram opens Mini App route.
3. Frontend reads Telegram `initData` and calls `POST /api/auth/telegram/webapp`.
4. Backend validates Telegram signature with bot token and returns app auth token.
5. User lands in game shell.
6. User can create room (`POST /api/rooms`) or join by code (`GET /api/rooms/:code`).

## 6) Deployment notes (Render/Fly.io/Heroku-style)

- Deploy backend as HTTPS service exposing `PORT`.
- Deploy frontend as static service (nginx or hosting platform).
- Ensure CORS allows frontend origin to call backend.
- Configure Telegram menu button with deployed frontend URL.
- Keep `TELEGRAM_BOT_TOKEN` and `APP_AUTH_SECRET` server-only.

## 7) API endpoints added in this feature

- `POST /api/auth/telegram/webapp`
- `POST /api/rooms` (requires `Authorization: Bearer <token>`)
- `GET /api/rooms/:code` (requires `Authorization: Bearer <token>`)

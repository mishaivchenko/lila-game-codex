# Lila Deployment on Time4VPS (IP-only, no SSL yet)

Target URL now: `http://80.208.231.142`

This setup is production-ready for MVP on one VPS and prepared for later domain+HTTPS migration.

## 1) Files used

- `/docker-compose.yml`
- `/deploy/Caddyfile`
- `/.env.example`
- `/backend/.env.production.example`
- `/frontend/.env.production.example`
- `/.github/workflows/deploy.yml`

## 2) Folder layout on server

Use this structure on VPS:

```text
/opt/lila/
  docker-compose.yml
  .env
  deploy/
    Caddyfile
  backend/
  frontend/
  cards/
  field/
```

## 3) Server bootstrap (root)

```bash
apt update && apt upgrade -y
apt install -y ca-certificates curl gnupg ufw git rsync

install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo $VERSION_CODENAME) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw enable
ufw status
```

## 4) Prepare `.env` on server

Create `/opt/lila/.env` with real values:

```env
PUBLIC_URL=http://80.208.231.142
CADDY_SITE_ADDR=:80

FRONTEND_IMAGE=ghcr.io/mishaivchenko/lila-frontend:latest
BACKEND_IMAGE=ghcr.io/mishaivchenko/lila-backend:latest

APP_AUTH_SECRET=<SET_REAL_SECRET>
TELEGRAM_BOT_TOKEN=<SET_REAL_TOKEN>

POSTGRES_DB=lila_prod
POSTGRES_USER=lila_user
POSTGRES_PASSWORD=<SET_REAL_DB_PASSWORD>
```

## 5) First manual deploy

From your local machine (repo root):

```bash
rsync -avz --delete \
  --exclude '.git' \
  --exclude 'node_modules' \
  --exclude 'frontend/node_modules' \
  --exclude 'backend/node_modules' \
  --exclude '.env' \
  --exclude 'tmp' \
  ./ root@80.208.231.142:/opt/lila/
```

Then on VPS:

```bash
cd /opt/lila
cp .env.example .env   # if .env is missing, then edit it
nano .env

docker compose up -d --build

docker compose ps
docker compose logs -f caddy
```

Check app:
- `http://80.208.231.142`
- `http://80.208.231.142/api/health`

## 6) GitHub Actions auto-deploy on `main`

Workflow: `/.github/workflows/deploy.yml`

### Required GitHub secrets

- `VPS_HOST` = `80.208.231.142`
- `VPS_USER` = `root` (later move to deploy user)
- `VPS_SSH_KEY` = private key content (`id_ed25519`)
- `VPS_APP_DIR` = `/opt/lila`
- `GHCR_USERNAME` = `mishaivchenko`
- `GHCR_PAT` = PAT with package read on server deploy step

### How it works
1. Push to `main` triggers workflow.
2. Frontend and backend Docker images are built and pushed to GHCR.
3. Workflow SSHes to VPS and runs:
   - `docker compose pull`
   - `docker compose up -d --remove-orphans`

## 7) Where to store secrets

- **Runtime app secrets** (`APP_AUTH_SECRET`, `TELEGRAM_BOT_TOKEN`, DB password):
  only in VPS file `/opt/lila/.env`.
- **CI/CD secrets** (SSH key, GHCR PAT):
  only in GitHub Secrets.

Do not commit any real secrets to git.

## 8) Future migration to domain + HTTPS (no rewrite)

When domain is ready:
1. DNS `A` -> VPS IP.
2. In `.env`, set:
   - `PUBLIC_URL=https://play.yourdomain.com`
   - `CADDY_SITE_ADDR=play.yourdomain.com`
3. In `/deploy/Caddyfile`, remove global block:
   ```caddy
   {
     auto_https off
   }
   ```
4. `docker compose up -d`

Caddy will issue certificates automatically.

## 9) Operations

### Backup Postgres

```bash
mkdir -p /opt/lila/backups
```

Cron example:
```cron
20 2 * * * docker exec $(docker compose -f /opt/lila/docker-compose.yml ps -q postgres) pg_dump -U lila_user lila_prod | gzip > /opt/lila/backups/lila_$(date +\%F).sql.gz
```

### Rollback

In `/opt/lila/.env` pin previous image tags:

```env
FRONTEND_IMAGE=ghcr.io/mishaivchenko/lila-frontend:<old_sha>
BACKEND_IMAGE=ghcr.io/mishaivchenko/lila-backend:<old_sha>
```

Then:
```bash
cd /opt/lila
docker compose pull
docker compose up -d
```

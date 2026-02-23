# Lila Production Migration Plan (Single VPS, Ukraine)

This guide covers production deployment on a single VPS with a low-cost MVP setup.

## 1) VPS provider recommendation (Ukraine)

### Recommendation: `VPS.UA` (primary)

Reason:
- clear KVM VPS lineup,
- predictable monthly billing,
- straightforward Linux provisioning,
- good enough for MVP + CI/CD Docker workflow.

### Suggested starting plan (MVP)
- Plan: **KVM-50**
- CPU: **2 vCPU**
- RAM: **4 GB**
- SSD/NVMe: **50 GB**
- Price from provider page: **$18.52/month**
- Approx in UAH (rate ~41.5 UAH/USD): **~769 UAH/month**

### Scale-up plan (if load grows)
- Plan: **KVM-100**
- CPU: **4 vCPU**
- RAM: **8 GB**
- SSD/NVMe: **100 GB**
- Price from provider page: **$37.04/month**
- Approx in UAH: **~1,537 UAH/month**

### Network expectations
- IPv4: typically included for VPS plans.
- IPv6: supported by provider product line (enable in panel if needed).
- Bandwidth: enough for MVP traffic; verify exact included traffic/fair-use in order form.

### IO.UA note
As of **2026-02-23**, public VPS tariff pages for `io.ua` were not clearly discoverable as a production VPS catalog. If you still want IO.UA, request commercial terms and compare against the VPS.UA baseline above.

### Performance expectation (~500 concurrent users)
For this stack (React static + Node API + Postgres):
- **KVM-50** is acceptable for MVP if traffic is bursty and API workload is moderate.
- For sustained high concurrency or heavier AI/real-time features, move to **KVM-100**.

## 2) Production stack architecture

Single server, Docker Compose:
- `caddy` (TLS termination + reverse proxy)
- `frontend` (React static bundle via nginx)
- `backend` (Node API)
- `postgres` (persistent volume)

Files added:
- `/Users/mishaivchenko/dev/lila-game-codex/docker-compose.yml`
- `/Users/mishaivchenko/dev/lila-game-codex/deploy/Caddyfile`
- `/Users/mishaivchenko/dev/lila-game-codex/.env.example`
- `/Users/mishaivchenko/dev/lila-game-codex/.github/workflows/deploy.yml`

## 3) Server bootstrap (manual)

Assume Ubuntu 22.04/24.04 on VPS.

### 3.1 Add SSH key and login
From your machine:
```bash
ssh-copy-id root@<VPS_IP>
ssh root@<VPS_IP>
```

### 3.2 Create deploy user (recommended)
```bash
adduser deploy
usermod -aG sudo deploy
mkdir -p /home/deploy/.ssh
cp /root/.ssh/authorized_keys /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
```

### 3.3 Base OS update
```bash
apt update && apt upgrade -y
apt install -y ca-certificates curl gnupg ufw fail2ban git
```

### 3.4 Install Docker + Compose plugin
```bash
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo $VERSION_CODENAME) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
usermod -aG docker deploy
```

### 3.5 Firewall
```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
ufw status
```

### 3.6 SSH hardening
Edit `/etc/ssh/sshd_config`:
- `PasswordAuthentication no`
- `PermitRootLogin no` (after confirming deploy user works)
- `PubkeyAuthentication yes`

Then:
```bash
systemctl restart ssh
```

## 4) App files on VPS

As `deploy` user:
```bash
mkdir -p /opt/lila
cd /opt/lila
```

Copy these files from repo:
- `docker-compose.yml`
- `deploy/Caddyfile`
- `.env.example` -> rename to `.env`

Example:
```bash
cp .env.example .env
nano .env
```

Set real values:
- `DOMAIN=play.yourdomain.com`
- `ACME_EMAIL=you@yourdomain.com`
- `FRONTEND_IMAGE=ghcr.io/<org_or_user>/lila-frontend:latest`
- `BACKEND_IMAGE=ghcr.io/<org_or_user>/lila-backend:latest`
- `APP_AUTH_SECRET=<long-random-secret>`
- `TELEGRAM_BOT_TOKEN=<botfather-token>`
- strong Postgres credentials

## 5) Domain + DNS

At your DNS provider:
- `A` record: `play.yourdomain.com` -> `<VPS_IPV4>`
- `AAAA` record (optional): `play.yourdomain.com` -> `<VPS_IPV6>`

Verify:
```bash
dig +short play.yourdomain.com A
dig +short play.yourdomain.com AAAA
```

Caddy auto-issues HTTPS certificates when 80/443 are reachable and DNS is correct.

## 6) First launch (manual)

```bash
cd /opt/lila

docker login ghcr.io -u <GHCR_USERNAME>
docker compose pull
docker compose up -d

docker compose ps
docker compose logs -f caddy
```

Health checks:
- `https://play.yourdomain.com`
- `https://play.yourdomain.com/health` (through API route design if exposed)
- `https://play.yourdomain.com/api/health`

## 7) GitHub Actions CI/CD

Workflow file:
- `/Users/mishaivchenko/dev/lila-game-codex/.github/workflows/deploy.yml`

What it does:
1. On push to `main`, builds frontend/backend images.
2. Pushes to GHCR (`ghcr.io/<owner>/lila-frontend`, `ghcr.io/<owner>/lila-backend`).
3. SSH to VPS and runs:
   - `docker compose pull`
   - `docker compose up -d --remove-orphans`

### Required GitHub Secrets
- `VPS_HOST` = VPS IP or DNS
- `VPS_USER` = `deploy`
- `VPS_SSH_KEY` = private key (PEM)
- `VPS_APP_DIR` = `/opt/lila`
- `GHCR_USERNAME` = github username/org robot account
- `GHCR_PAT` = token with `read:packages`

## 8) Security minimum baseline

- SSH keys only, password auth disabled.
- `ufw` allow only `22`, `80`, `443`.
- No public Postgres port mapping.
- Keep secrets only in VPS `.env` + GitHub Secrets.
- Run periodic updates:
  ```bash
  apt update && apt upgrade -y
  ```
- Enable fail2ban service:
  ```bash
  systemctl enable --now fail2ban
  ```

## 9) Backups, updates, rollback

### Postgres backup
Daily cron example:
```bash
mkdir -p /opt/lila/backups
```
Cron (`crontab -e`):
```cron
15 2 * * * docker exec $(docker ps --filter name=postgres --format '{{.ID}}') pg_dump -U $POSTGRES_USER $POSTGRES_DB | gzip > /opt/lila/backups/lila_$(date +\%F).sql.gz
```

Also copy backups off-server (S3/another VPS/secure storage).

### Manual update
```bash
cd /opt/lila
docker compose pull
docker compose up -d --remove-orphans
```

### Rollback
Pin previous image tag in `.env`, for example:
- `FRONTEND_IMAGE=ghcr.io/<owner>/lila-frontend:<previous_sha>`
- `BACKEND_IMAGE=ghcr.io/<owner>/lila-backend:<previous_sha>`

Then:
```bash
docker compose pull
docker compose up -d
```

## 10) Practical MVP checklist

- [ ] VPS created (Ubuntu LTS, KVM-50 minimum)
- [ ] SSH key login works for `deploy`
- [ ] Docker + Compose installed
- [ ] UFW enabled (22/80/443)
- [ ] DNS A/AAAA points to VPS
- [ ] `.env` prepared on VPS
- [ ] GitHub Secrets configured
- [ ] `main` push triggers deploy workflow
- [ ] HTTPS active (Caddy cert issued)
- [ ] Backups scheduled and tested

## Sources (pricing/reference checked on 2026-02-23)
- VPS.UA pricing page: https://vps.ua/eng/vps_hosting.php
- VPS.UA article (KVM-50/KVM-100 pricing examples): https://vps.ua/blog/ua-vps-hosting-for-ai-chatbots-telegram-bot-api-and-integration-with-openai/
- NBU exchange context: https://bank.gov.ua/ua/markets/exchangerates

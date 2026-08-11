# Word Game (Kung Fu Word Quest)

Production-oriented word puzzle app: React SPA + Spring Boot API, **Supabase PostgreSQL**, **Redis** (local/Docker), and **GCS** for media binaries only.

## Architecture

| Component | Where |
|-----------|--------|
| API | Application server (Docker) |
| SPA | nginx on same server |
| PostgreSQL | **Supabase** (managed) — not localhost |
| Redis | Docker on the server / `docker compose` for local Redis |
| Images / audio | Google Cloud Storage |

## Local development

### 1. Redis only

```bash
cd backend
docker compose up -d
```

This starts **Redis only**. Postgres stays on Supabase.

### 2. Backend

```bash
cd backend
cp .env.example .env   # already points at Supabase
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

API: `http://localhost:8080` — health: `/actuator/health`

### 3. Frontend

```bash
cd frontend
cp .env.example .env.development
npm install
npm run dev
```

Vite proxies `/api` → `http://localhost:8080`.

## Environment

**Backend**

- `SPRING_DATASOURCE_URL` / `USERNAME` / `PASSWORD` — Supabase pooler
- `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD`
- `JWT_SECRET`
- `APP_CORS_ORIGINS`
- `APP_ASSET_BASE_URL` — GCS base, e.g. `https://storage.googleapis.com/kungfu-word-quest-assets`

**Frontend**

- `VITE_API_BASE_URL` — empty in prod (same-origin `/api` via nginx); optional absolute URL in special setups
- `VITE_ASSET_BASE_URL` — same GCS base as backend

## Media (GCS)

Place files under `media/{backgrounds,cards,audio,ui}` then:

```bash
./scripts/sync-media-to-gcs.sh kungfu-word-quest-assets
```

Configure bucket CORS for canvas (`crossOrigin=anonymous`). See script output.

## Production

```bash
cd frontend && npm ci && npm run build && cd ..
docker compose -f docker-compose.prod.yml up -d --build
```

- nginx serves SPA and proxies `/api` → API
- API uses Supabase + Redis container
- Backups: `./scripts/backup-supabase.sh` (cron)
- CI example: `.github/workflows/deploy.yml`

## Auth & gameplay

- Register / login against `/api/v1/auth/*` (JWT access + refresh)
- Daily puzzle never returns `validWords` to the client
- Progress (XP, coins, cards, achievements, leaderboard) is server-authoritative

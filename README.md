# Kung Fu Word Quest

Production-oriented word puzzle app: React SPA + Spring Boot API, with **local Docker Postgres + Redis**.

## Architecture

| Component | Local default |
|-----------|----------------|
| API | Spring Boot on `:8080` |
| SPA | Vite on `:5173` (proxies `/api`) |
| PostgreSQL | Docker (`kungfu_postgres`) |
| Redis | Docker (`kungfu_redis`, host port **6380**) |

Gameplay payloads that change infrequently are stored client-side (IndexedDB + sessionStorage). Repeat reads hit the cache instead of the network until TTL expires or a mutation invalidates them. Static images also warm the browser **Cache Storage** API during preload.

## Quick start (local)

### 1. Start Postgres + Redis

From the project root:

```bash
docker compose up -d
```

Health checks wait until both services accept connections.

### 2. Backend

```bash
cd backend
cp .env.example .env   # already points at local Docker DB/Redis
./mvnw spring-boot:run
```

- API: `http://localhost:8080`
- Health: `http://localhost:8080/actuator/health`
- Swagger: `http://localhost:8080/swagger-ui.html`

### 3. Frontend

```bash
cd frontend
cp .env.example .env.development
npm install
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api` → `http://localhost:8080`.

## Database schema (Flyway)

Schema is versioned under `backend/src/main/resources/db/migration/`.  
Hibernate `ddl-auto` is **`validate`** — do **not** change columns via JPA auto-update.

| File | Purpose |
|------|---------|
| `V1__baseline_schema.sql` | Full baseline (do not edit after release) |
| `V2__…` onward | Additive changes only |

History table: **`flyway_schema_history`**. See [backend/docs/DATABASE_MIGRATIONS.md](backend/docs/DATABASE_MIGRATIONS.md).

Profiles: default **`local`**; production **`SPRING_PROFILES_ACTIVE=prod`**.

## Environment

**Backend** (`backend/.env`)

| Variable | Purpose |
|----------|---------|
| `DATASOURCE_URL` / `DB_USERNAME` / `DB_PASSWORD` | Local Postgres |
| `JPA_DDL_AUTO` | Keep `validate` (Flyway owns schema) |
| `FLYWAY_ENABLED` | `true` |
| `REDIS_HOST` / `REDIS_PORT` | Local Redis (`6380` → Docker) |
| `JWT_SECRET` | Access/refresh signing key (32+ chars) |
| `APP_CORS_ORIGINS` | Comma-separated browser origins |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Optional admin bootstrap |
| `APP_SEED_LOCAL_ADMIN` | Dev-only; must be `false` in prod |
| `SPRING_PROFILES_ACTIVE` | `local` (default) or `prod` |

**Frontend**

| Variable | Purpose |
|----------|---------|
| `VITE_API_BASE_URL` | Leave empty in local/dev (use Vite proxy) |

## Client cache policy

| Data | Store | TTL | Invalidated when |
|------|-------|-----|------------------|
| Dashboard | IndexedDB + session | ~90s | puzzle complete, draw/equip, reset, logout |
| Profile | IndexedDB + session | ~2m | same |
| Card catalog | IndexedDB | 24h | logout / force refresh |
| Collection | IndexedDB | ~2m | draw / equip |
| Achievements | IndexedDB | ~2m | gameplay / reset |
| Leaderboard | IndexedDB | ~3m | gameplay / reset |
| Daily puzzle | IndexedDB | ~30m | gameplay / reset |
| Choice puzzle | sessionStorage | ~5m | gameplay |
| Static assets | Cache Storage | durable | asset URL change |

Auth tokens stay in `localStorage` (`kungfu_auth`). Theme/sound stay in `kungfu_settings`.

## Auth & gameplay notes

- Register / login against `/api/v1/auth/*` (JWT access + refresh)
- Daily puzzle never returns `validWords` to the client
- Progress (XP, coins, cards, achievements, leaderboard) is server-authoritative
- Client cache is a performance layer only — mutations always hit the API

## Useful commands

```bash
# Stop local infra
docker compose down

# Backend tests
cd backend && ./mvnw test

# Frontend contracts
cd frontend && npm run test:settings && npm run test:collection
```

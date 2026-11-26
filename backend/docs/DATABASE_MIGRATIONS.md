# Database migrations (Flyway)

Schema changes are **only** applied through Flyway versioned SQL under:

`backend/src/main/resources/db/migration/`

Hibernate `ddl-auto` is **`validate`** (never `update` / `create` in local or prod).  
Flyway tracks applied scripts in PostgreSQL table **`flyway_schema_history`**.

## Naming

```
V{version}__{short_description}.sql
```

Examples:

- `V1__baseline_schema.sql` — initial schema (do not edit after release)
- `V2__session_completion_awards.sql` — add columns
- `V3__drop_legacy_password.sql` — next change

Rules:

1. **Never edit** a migration that has already run in any shared environment.
2. Always add a **new** `V{n+1}__...sql` file for schema changes.
3. Prefer additive, backward-compatible changes (add column → deploy → backfill → tighten).
4. Do not use `flyway clean` against production (`clean-disabled: true`).

## How it runs

On application startup Spring Boot runs Flyway before JPA:

| Database state | Behavior |
|----------------|----------|
| Empty Postgres | Runs `V1`, then `V2`, … |
| Existing schema (pre-Flyway) | `baseline-on-migrate` records baseline **v1**, then applies `V2+` only |
| Already migrated | Applies only pending versions |

After pulling new migrations, restart the API (or run the app once) so Flyway applies pending versions before Hibernate `validate`.

Inspect history:

```sql
SELECT installed_rank, version, description, success, installed_on
FROM flyway_schema_history
ORDER BY installed_rank;
```

## Local / prod config

| Setting | local | prod |
|---------|-------|------|
| `spring.flyway.enabled` | true | true |
| `spring.jpa.hibernate.ddl-auto` | validate | validate |
| `SPRING_PROFILES_ACTIVE` | `local` (default) | `prod` |
| Swagger | on | off |
| Local admin seed | allowed | forbidden |

Production fails fast if `JWT_SECRET` is weak/placeholder or `APP_SEED_LOCAL_ADMIN=true`.

## Tests

`application-test.yml` disables Flyway and uses H2 `create-drop` so unit tests stay fast and isolated.

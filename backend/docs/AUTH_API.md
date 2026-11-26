# Authentication API

Base path: `/api/v1/auth`

Envelope: `{ success, message, data, error?, timestamp }`

## POST /api/v1/auth/register (public)

**Request**
```json
{ "userName": "Rakhi", "userEmail": "rakhi@example.com", "password": "StrongPass1" }
```

**Validation**
| Field | Rules |
|-------|--------|
| userName | Required, trim, 3–30, `^[A-Za-z][A-Za-z0-9_]{2,29}$`, unique (case-insensitive) |
| userEmail | Required, trim, lowercase store, email pattern, unique |
| password | Required, 8–40, upper+lower+digit, no whitespace; BCrypt hashed |

**Success** `201`
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "message": "Registration successful",
    "user": { "userId": "...", "userName": "Rakhi", "userEmail": "rakhi@example.com", "role": "ROLE_USER" }
  }
}
```

**Errors:** `400` field map in `data`; `409` duplicate username/email.

Does **not** return JWT (client must login).

---

## POST /api/v1/auth/login (public)

**Request**
```json
{ "userEmail": "rakhi@example.com", "password": "StrongPass1" }
```

**Success** `200` → `data.accessToken`, `data.refreshToken`, `data.user`

**Errors:** `401` `"Invalid email or password"` (generic).

---

## POST /api/v1/auth/refresh (public)

**Request** `{ "refreshToken": "..." }`  
**Success** new access + refresh tokens + user.  
Revoked after logout (`tokenVersion` mismatch → 401).

---

## POST /api/v1/auth/logout (Bearer required)

Increments `tokenVersion` so prior access/refresh JWTs stop working.

---

## GET /api/v1/users/me (Bearer required)

Returns `UserResponse` for the authenticated principal only (no password hash).

---

## Security notes

- Stateless JWT; CSRF disabled because SPA uses `Authorization: Bearer` (not cookie session).
- JWT claims: `sub` (username), `uid`, `email`, `type`, `roles`, `ver`, `iat`, `exp`.
- Secrets via env: `JWT_SECRET`, `JWT_EXPIRATION_MS` / `EXPIRATION_MS`.
- Token storage (FE): localStorage — XSS risk; acceptable for this SPA; prefer HttpOnly cookies later.

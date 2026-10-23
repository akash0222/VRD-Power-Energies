# API reference

All responses are JSON.

## Public
- `GET /api/health` — health check.
- `POST /api/enquiries` — create enquiry. Required: `name`, `phone`, `category`, `message`; optional: `email`, `company`, `quantity`.

## Admin
- `POST /api/admin/login` — body `{ "email": "...", "password": "..." }`; sets HttpOnly session cookie.
- `POST /api/admin/logout` — clears session cookie.
- `GET /api/admin/enquiries` — authenticated; lists up to 500 recent enquiries.
- `PATCH /api/admin/enquiries/:id` — authenticated; body status is `new`, `in_progress`, or `resolved`.

Admin requests from the admin site must use `credentials: 'include'`. Configure exact allowed frontend origins via `FRONTEND_ORIGINS`.

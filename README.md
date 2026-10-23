# VRD Power Energies — production starter

This package contains a static Vercel frontend and a Node/Express API intended for Render (or another Node host), with MongoDB Atlas storage, protected admin dashboard, rate limiting and optional SMTP email notifications.

## Company details configured
- Brand: VRD Power Energies
- WhatsApp: +91 99561 91939 (wa.me link uses 919956191939)
- Location: Kannauj, Uttar Pradesh, India
- Email: intentionally left as `YOUR_BUSINESS_EMAIL` / environment placeholders until the real address is provided.

## Architecture
- Frontend: Vercel static hosting
- API/admin dashboard: Node.js service at `/admin`
- Database: MongoDB Atlas
- Email: SMTP provider configured through environment variables

## Local setup
1. Install Node.js 20 or later.
2. Create a MongoDB Atlas database and allow the API host's outbound access per Atlas instructions.
3. In `server`, run `npm install`.
4. Copy `.env.example` to `.env` and fill in real credentials. Never commit `.env`.
5. Generate a password hash with `node src/hash-password.js "your-long-unique-password"` and place the output in `ADMIN_PASSWORD_HASH`.
6. Set `FRONTEND_ORIGINS` to the exact local/Vercel origin. `config.js` must point to the API origin when frontend and API are hosted separately.
7. Start locally: `npm run dev`.
8. Admin: `http://localhost:5000/admin`; health: `http://localhost:5000/api/health`.

## Deploy the API (Render example)
- Create a new Web Service from the repository's `server` directory (or set root directory to `server`).
- Runtime: Node.
- Build command: `npm install`
- Start command: `npm start`
- Add environment variables from `.env.example` in the Render dashboard.
- Set `NODE_ENV=production`, `MONGODB_URI`, `JWT_SECRET` (32+ random chars), `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `FRONTEND_ORIGINS`, and SMTP settings once available.
- Do not add `.env` to Git. Use provider environment settings.
- Once deployed, test `https://YOUR-API-HOST/api/health` and `https://YOUR-API-HOST/admin`.

## Deploy the frontend (Vercel)
- Import the repository into Vercel.
- Framework preset: Other.
- Root directory: repository root.
- Build command: leave empty / no build.
- Output directory: `.`.
- Update `config.js` `API_BASE_URL` to the deployed API origin, e.g. `https://your-api-host.onrender.com`. Commit and redeploy.
- Add the final Vercel origin to the API's `FRONTEND_ORIGINS`, then redeploy/restart the API.

## Email
A real business inbox is not yet provided, so email notifications are not active until `NOTIFY_EMAIL`, `FROM_EMAIL`, and valid SMTP host/user/password are configured. The database save occurs independently of email delivery. Use an email provider that permits transactional SMTP and verify sender-domain authentication (SPF/DKIM/DMARC) before production.

## Admin dashboard and security
- Admin dashboard is served by the API at `/admin`, not publicly accessible without login for enquiry data.
- Passwords are compared against a bcrypt hash; JWT is stored in an HTTP-only cookie.
- Set a long, random JWT secret and strong unique admin password.
- Use only HTTPS in production.
- Restrict database access, keep backups enabled, and never commit secrets.
- Review enquiry data handling and publish a privacy notice/consent message before collecting personal data.
- This starter has basic validation and rate limiting. Before broad launch, consider CAPTCHA/bot protection, monitoring, scheduled backups and a documented retention policy.
- For a separate Vercel frontend and API, cross-site cookies are avoided for admin because `/admin` lives on the API origin; customers submit public enquiries cross-origin with CORS. Test the enquiry form from the deployed frontend.

## Not included
- No live deployment was performed from this package.
- No credentials, database, email inbox, domain or Vercel project have been provisioned.
- No battery certification/specifications are asserted. Publish only validated product claims.

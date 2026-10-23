# VRD Power Energies

Modern React + Vite website and admin portal for VRD Power Energies, Kannauj, Uttar Pradesh, India.

## Included
- `client/`: public product catalogue, product enquiry/quotation form, contact links and responsive layout.
- `admin/`: separate React admin dashboard for reviewing enquiries and updating statuses.
- `server/`: Express API, MongoDB/Mongoose models, validation, authentication, rate limiting and optional SMTP notification.
- `docs/`: deployment and API guidance.

## Confirmed business details
- Business name: VRD Power Energies
- Location: Kannauj, Uttar Pradesh, India
- WhatsApp: +91 9956191939 (`https://wa.me/919956191939`)
- Product categories: EV batteries and energy-storage batteries
- Audience: B2B and retail
- Stage: startup

No business email, certifications, manufacturing capacity, battery specifications, prices, warranties, or other credentials have been invented. Product specifications are intentionally marked “Contact for specifications” until confirmed.

## Requirements
Node.js 20+ and MongoDB (local or Atlas).

## Local setup
1. Copy `server/.env.example` to `server/.env` and set secrets.
2. Install dependencies:
   ```bash
   npm install
   npm run install:all
   ```
3. Start API:
   ```bash
   npm run dev:server
   ```
4. In another terminal start public site:
   ```bash
   npm run dev:client
   ```
5. Start admin in another terminal:
   ```bash
   npm run dev:admin
   ```

Public site: Vite's local URL (typically `http://localhost:5173`).
Admin: Vite's local URL (typically `http://localhost:5174/admin`).
API: `http://localhost:5000`.

## Admin account
Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in the server environment. The server hashes the configured password using bcrypt at login. Use a long, unique production password. JWTs are stored in an HttpOnly cookie.

## Production deployment
- API: deploy `server/` to Render or another Node host. Build command `npm install`, start command `npm start`.
- Public site: deploy `client/` to Vercel, root directory `client`, build `npm run build`, output `dist`.
- Admin: deploy `admin/` to Vercel, root directory `admin`, build `npm run build`, output `dist`.
- Set `VITE_API_URL` to the deployed API origin in both Vercel projects.
- Set server environment variables from `server/.env.example`. Set `FRONTEND_ORIGINS` to the exact deployed public/admin origins, comma-separated.
- Set `MONGODB_URI`, a strong `JWT_SECRET` (32+ random characters), `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and SMTP variables if email notifications are required.
- Enable HTTPS on all production origins. Never commit `.env` files.

## Before going live
- Confirm product models/specifications, photos, prices and warranty terms.
- Configure a real business email if email notifications should be sent.
- Test quotation submission, admin login, status updates, rate limits and production CORS.
- Set up MongoDB backups and review privacy/retention requirements.

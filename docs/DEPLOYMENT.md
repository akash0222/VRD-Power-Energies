# Deployment checklist

## API on Render
- Create a Web Service connected to this repository.
- Root directory: `server`
- Build command: `npm install`
- Start command: `npm start`
- Add environment variables from `server/.env.example`.
- Use a MongoDB Atlas connection string.
- Set `NODE_ENV=production`, a random `JWT_SECRET` of at least 32 characters, strong admin credentials, and `FRONTEND_ORIGINS` to the exact deployed frontend origins separated by commas. The API normalizes host-only entries to HTTPS origins. Production automatically enables secure session cookies (`Secure`, `SameSite=None`) for separate Vercel and Render sites; `COOKIE_SECURE=true` is still recommended explicitly.
- Configure SMTP only after a verified sender account and notification email are available.

## Public website on Vercel
- Import repository and set root directory `client`.
- Framework: Vite; build command `npm run build`; output directory `dist`.
- Set `VITE_API_URL` to the API origin, without a trailing slash.
- Add the deployed public origin to server `FRONTEND_ORIGINS`.

## Admin dashboard on Vercel
- Create a second Vercel project from the same repository.
- Root directory `admin`, build `npm run build`, output `dist`.
- Set `VITE_API_URL` to the API origin.
- Add the deployed admin origin to server `FRONTEND_ORIGINS`.

## Operations
- Configure automated MongoDB backups and verify restore procedures.
- Review logs, database access, cookie settings, CORS, and admin credentials before launch.
- Test all flows after every deployment.

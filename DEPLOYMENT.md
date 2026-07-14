# Deployment Guide — Neon + Render + Vercel

## 1. Database — Neon

1. Create a project at [neon.tech](https://neon.tech).
2. Copy the pooled connection string (`postgresql://...`) from the Neon dashboard — use the "Pooled connection" string for the app, since Render's backend will open many short-lived connections.
3. Keep this handy as `DATABASE_URL`.

## 2. Backend — Render

1. Push this repository to GitHub/GitLab.
2. In Render, create a **New Web Service** pointing at the `backend/` directory.
3. Build command: `npm install && npm run build && npx prisma migrate deploy`
   Start command: `npm start`
4. Set environment variables (Render dashboard → Environment):
   - `NODE_ENV=production`
   - `DATABASE_URL` = your Neon pooled connection string
   - `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` = long random values (`openssl rand -base64 48`)
   - `CLIENT_URL` = your Vercel frontend URL (e.g. `https://eveshield.vercel.app`) — required for CORS and Socket.IO to accept the frontend's origin
   - `PORT` — Render sets this automatically; the app reads `process.env.PORT`
5. After the first deploy, run the seed script once from the Render shell (or a one-off job) to create initial user accounts:
   ```bash
   npm run prisma:seed
   ```
   Then immediately change those demo passwords via the database or a follow-up admin-management feature.
6. Render's free/starter web services provide HTTPS automatically — no extra TLS configuration is needed. Socket.IO works over the same HTTPS origin (`wss://`).

## 3. Frontend — Vercel

1. In Vercel, import the repository and set the **root directory** to `frontend/`.
2. Framework preset: Vite.
3. Build command: `npm run build` — Output directory: `dist` (Vercel detects this automatically for Vite).
4. Environment variable:
   - `VITE_API_URL` = `https://<your-render-service>.onrender.com/api`
5. Deploy. Vercel provisions HTTPS automatically.

## 4. Wire CORS both ways

- Backend `CLIENT_URL` must exactly match the deployed Vercel URL (including `https://`, no trailing slash) — this is used for both the Express CORS policy and the Socket.IO CORS policy.
- If you later add a custom domain on Vercel, update `CLIENT_URL` on Render to match.

## 5. Post-deploy checklist

- [ ] Confirm `GET https://<render-service>/health` returns `{"status":"ok"}`
- [ ] Confirm login works from the deployed frontend and a session survives a page refresh (refresh-token cookie flow)
- [ ] Confirm a `POST /api/emergencies` call shows up on the dashboard within ~1 second (Socket.IO round-trip)
- [ ] Rotate the seeded demo passwords or delete/replace those accounts
- [ ] Set `NODE_ENV=production` on Render so Express/Prisma use production logging and secure cookies (`secure: true` on the refresh cookie requires HTTPS, which Render provides)

## 6. Docker alternative

If you'd rather self-host instead of Render/Vercel, `docker-compose.yml` at the repo root builds and runs Postgres, the backend, and an Nginx-served frontend build together — see the README's "Or run everything with Docker Compose" section. For production self-hosting, put a reverse proxy (e.g. Caddy or Nginx) in front with TLS termination, and point `DATABASE_URL` at Neon (or your own managed Postgres) rather than the bundled Postgres container.

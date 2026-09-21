# Beacon — Live Location Tracker (Vercel-ready)

A modern rebuild of the live GPS tracker:

- **Beautiful, animated UI** — GSAP entrance/pulse/ambient animations, glassmorphism, dark aurora theme.
- **Real authentication** — register + login, bcrypt-hashed passwords, JWT sessions in httpOnly cookies, account lockout after 5 failed attempts.
- **Neon (PostgreSQL) database** — devices, trails and users persist (no more in-memory state).
- **Same core functionality** — a public decoy *Weather App* page silently streams a device's GPS to the Beacon dashboard, where you can watch it move on a live Leaflet map (with a movement trail).
- **Vercel-ready** — serverless-safe: no long-lived WebSockets, just lightweight polling (4s dashboard/map, 5s device pings).

> **Realtime note:** Socket.IO WebSockets need a persistent server, which Vercel serverless functions don't provide. This rebuild uses short-interval polling instead — near-real-time with zero extra services.

---

## Stack

| Layer | Tech |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript (strict) |
| Auth | jose (JWT in httpOnly cookies) + bcryptjs + zod validation |
| Database | Neon (serverless PostgreSQL) via Prisma 7 + `@prisma/adapter-neon` |
| Maps | react-leaflet + Leaflet (dark CARTO tiles) |
| Animation | GSAP |
| Styling | Tailwind CSS v4 |

---

## Getting started

### 1. Install

```bash
npm install          # also runs `prisma generate` (postinstall)
```

### 2. Create the Neon database

1. Sign up at [neon.tech](https://neon.tech) → **Create a project** (any region).
2. In the dashboard open **Connect** and copy two connection strings:
   - **Pooled** connection (used by the app at runtime)
   - **Direct** connection (used by the Prisma CLI)
3. Create your local env file:

```bash
copy .env.example .env
```

Fill in:

```dotenv
# Pooled (runtime) — Neon → Connect → "Pooled connection"
DATABASE_URL="postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require"

# Direct (CLI) — Neon → Connect → "Direct connection"
DIRECT_URL="postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb"

# Any long random string — used to sign session JWTs
AUTH_SECRET="generate-with: openssl rand -base64 48"
```

### 3. Create the schema

```bash
npm run db:push      # creates tables (User, Target, LocationPoint)
```

### 4. Create your account

```bash
npm run db:seed      # creates ADMIN_USERNAME / ADMIN_PASSWORD from .env (defaults admin / change-me-123)
```

Or just use **Register** in the app after `npm run dev`.

### 5. Run it

```bash
npm run dev
```

- `/login` or `/register` → your command center
- `/weather` → the decoy page that captures + streams GPS (share this URL)
- Dashboard → device card → `/map/<device-id>` → live Leaflet map with trail

---

## Deploy to Vercel

1. Push this folder to a git repo.
2. Import it in Vercel (framework preset: **Next.js** — auto-detected).
3. Add the environment variables (Settings → Environment Variables):
   - `DATABASE_URL` (pooled Neon string)
   - `DIRECT_URL` (direct Neon string)
   - `AUTH_SECRET` (random string)
4. **Optional:** during your first deploy, run the seed once to create the admin
   account. You can also just register through the UI after deploying.
5. Deploy. The build runs `prisma generate` automatically (`postinstall`).

> Neon free tier scales a compute to zero after ~5 min of inactivity — first
> request after idle takes a second or two to wake up. Totally normal.

---

## Project layout

```
app/
  api/auth/{register,login,logout,session}/  JWT auth API
  api/targets/                                dashboard feed (auth)
  api/location/                               device ping (POST, public) + trail (GET, auth)
  login/ register/ map/[id]/ weather/         pages
components/
  auth-form.tsx        login/register (GSAP tilt + entrance)
  dashboard-view.tsx   stats + device cards (GSAP count-ups, polling)
  map-view.tsx         Leaflet map (GSAP pin drop, trail, polling)
  weather-view.tsx     decoy weather page (GSAP scene, GPS pings)
  animated-background.tsx
lib/
  jwt.ts  auth.ts  db.ts  targets.ts  validation.ts  utils.ts
prisma/
  schema.prisma        User / Target / LocationPoint
  seed.ts              admin bootstrap
proxy.ts               route guard (Next 16 middleware)
```

---

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | local dev server |
| `npm run build` / `npm start` | production build + serve |
| `npm run db:push` | push Prisma schema to Neon (no migration history) |
| `npm run db:migrate` | create + apply migrations |
| `npm run db:seed` | create the admin user |
| `npm run db:studio` | Prisma Studio (visual DB browser) |

---

## Security notes

- Passwords are hashed with bcrypt (cost 12). Stored hashes only.
- Sessions are signed JWTs in `httpOnly`, `SameSite=lax` cookies (secure in prod).
- Login is throttled: 5 failed attempts locks the account for 15 minutes.
- All input (auth + location) is validated with zod before touching the DB.
- Only the operator (authenticated) can view the dashboard or map; the decoy
  `/weather` page and its location POST are public by design.
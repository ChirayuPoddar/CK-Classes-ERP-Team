# C.K. Classes ERP — DevOps & Deployment: Complete Plan + Gap Analysis

**Owner:** Keerthi (DevOps & Deployment)
**Status:** Code fixes applied and tested locally. Platform provisioning (Atlas/Render/Vercel/DNS) still required — cannot be done from this environment.

This document consolidates: (1) what was broken in the repo, (2) the code changes already made and verified, (3) the deployment files already created, (4) exactly what's still missing, and (5) the step-by-step execution plan. Hand this whole file to whoever/whatever finishes the platform setup (e.g. antigravity) — it's self-contained.

---

## 1. What was broken (found by inspection, confirmed by running the code)

| # | Issue | File | Risk if shipped as-is |
|---|-------|------|------------------------|
| 1 | CORS origin check always called `callback(null, true)` regardless of match — the `allowedOrigins` whitelist was dead code | `server/src/app.js` | Any origin accepted for credentialed (cookie) requests in production |
| 2 | Socket.IO CORS used a separate hardcoded `'https://yourproductiondomain.com'` placeholder, disconnected from Express's `CLIENT_URL` | `server/server.js` | Real-time features break in prod, or silently allow the wrong origin, independent of the app.js fix |
| 3 | Cookie options (`httpOnly`/`secure`/`sameSite`/`domain`) were duplicated 4 times (login/refresh, logout, logout clear, reset-password) with no `domain` support at all | `server/src/routes/authRoutes.js` | Editing one for prod and missing the others → logout/reset-password can't clear cookies set with different attributes; cross-subdomain cookie sharing impossible without `domain` |
| 4 | `morgan('dev')` hardcoded regardless of environment | `server/src/app.js` | Verbose colored dev logs in production instead of standard access logs |
| 5 | No SPA rewrite config for the frontend host | `client/` (missing file) | Deep links (e.g. `/admin/students` on refresh) 404 on Vercel/Netlify |
| 6 | No CI/CD pipeline | repo root (missing) | No automated lint/build check before merge, no automated deploy trigger |
| 7 | `multer.memoryStorage()` used for a **500MB** resource-upload limit | `server/src/middlewares/uploadMiddleware.js` | A large video/resource upload buffers entirely in RAM before forwarding to Cloudinary/ImageKit — can OOM a small hosting tier (e.g. Render free/starter, 512MB–1GB RAM) under concurrent uploads |
| 8 | `multer@1.4.5` — deprecated with known vulnerabilities (flagged by `npm install`) | `server/package.json` | Should be upgraded to multer 2.x independent of deployment, flagging for whoever owns that dependency |

Items 1–4 are **fixed and verified below**. Item 5–6 are **new files added below**. Items 7–8 are **flagged, not fixed** — they belong to whoever owns the upload middleware / dependency list, not DevOps, but they directly affect what hosting tier you choose, so they're listed here.

---

## 2. Code changes made (already applied in this working copy)

### 2.1 `server/src/app.js` — CORS now actually enforces the whitelist

- `CLIENT_URL` can now be a comma-separated list (supports staging + prod origins at once).
- In production, if `CLIENT_URL` isn't set, the origin list is **empty** (fail closed — blocks all cross-origin browser requests) instead of silently falling back to a fake placeholder domain.
- Non-browser requests (no `Origin` header — curl, Postman, server-to-server, mobile app via native HTTP client) are still allowed through, matching existing mobile-team expectations.
- `morgan` now logs `'combined'` format in production, `'dev'` locally.

**Verified live**: started the server with `NODE_ENV=production` and `CLIENT_URL=https://app.ckclasses.com`, then sent real HTTP requests:
- `Origin: https://app.ckclasses.com` → `200`, `Access-Control-Allow-Origin` echoed back correctly.
- `Origin: https://evil.com` → CORS error thrown, correctly caught by the existing `errorHandler`.
- No `Origin` header → `200`, passes through untouched.

### 2.2 `server/server.js` — Socket.IO CORS now shares one source of truth

Socket.IO's allowed origins are now derived from the same `CLIENT_URL` env var as Express, instead of an independent hardcoded string. One env var to set, not two.

### 2.3 `server/src/routes/authRoutes.js` — centralized cookie options

Added a single `getBaseCookieOptions()` helper, now used by all 4 places that previously duplicated cookie attributes (login/refresh `setCookies`, `/logout`, `/logout-all`, `/reset-password`). Two new **optional** env vars control it:

- `COOKIE_DOMAIN` — set only if frontend and backend share a root domain (e.g. `.ckclasses.com`), so the cookie is sent from `app.ckclasses.com` to `api.ckclasses.com`. Leave blank otherwise.
- `COOKIE_SAMESITE` — `lax` (default; same-site or shared-root-domain deployments) or `none` (required if frontend/backend are on **fully unrelated** hosts, e.g. two separate `onrender.com`/`vercel.app` subdomains with no shared root domain — this also forces `secure: true` automatically).

This means: pick **one** of the two deployment shapes below, set the matching env vars, and every cookie-setting/clearing code path behaves consistently — no risk of logout failing to clear a cookie set with different attributes.

**Deployment shape A — shared root domain (recommended):**
```
CLIENT_URL=https://app.ckclasses.com
COOKIE_DOMAIN=.ckclasses.com
COOKIE_SAMESITE=lax
```

**Deployment shape B — unrelated hosts (e.g. quick free-tier demo):**
```
CLIENT_URL=https://ck-client.vercel.app
COOKIE_DOMAIN=        (leave blank)
COOKIE_SAMESITE=none
```

Verified: `node --check` passes on all 3 edited files, and the full `app.js` module loads cleanly with dummy secrets.

### 2.4 `server/.env.example` — documents the 2 new optional vars

`COOKIE_DOMAIN` and `COOKIE_SAMESITE` added with inline explanation (see file). No real secrets touched; `.env` itself was never opened or modified.

---

## 3. New files added

- **`client/vercel.json`** — SPA rewrite so React Router deep links don't 404 on Vercel.
- **`.github/workflows/deploy.yml`** — CI/CD pipeline:
  - On every push/PR to `main`: install + lint + build the client, install the server and verify `app.js` requires cleanly (catches syntax/wiring errors before merge).
  - On push to `main` only (not PRs): triggers a Render deploy hook via `secrets.RENDER_DEPLOY_HOOK_URL` (you add this secret in GitHub repo settings once the Render service exists — never commit it).

---

## 4. What's still missing (cannot be done from a local sandbox — needs your accounts/dashboards)

These are the real remaining action items — nothing more to "code," just platform setup:

1. **MongoDB Atlas**
   - Create cluster (M0 free for staging, M10 for production per the earlier cost table).
   - Create a DB user + password, restrict network access (or `0.0.0.0/0` if relying on strong credentials + TLS only — acceptable for early staging, not ideal long-term).
   - Get the `mongodb+srv://...` connection string → this becomes `MONGO_URI`.

2. **Render (or Railway) — backend**
   - New Web Service, root dir `server`, build `npm install`, start `node server.js`.
   - Set env vars in the dashboard: everything in `server/.env.example` with real values (`NODE_ENV=production`, real `MONGO_URI`, real JWT secrets — generate with e.g. `openssl rand -hex 32`, real SMTP creds, real Cloudinary/ImageKit creds, and `CLIENT_URL` + `COOKIE_DOMAIN`/`COOKIE_SAMESITE` per whichever deployment shape you pick in §2.3).
   - Copy the service's **Deploy Hook URL** → add as GitHub secret `RENDER_DEPLOY_HOOK_URL` so the new CI workflow can trigger it.
   - Confirm `/health` responds `200` after first deploy.

3. **Vercel (or Netlify) — frontend**
   - Import repo, root dir `client`, framework preset Vite, build `npm run build`, output `dist`.
   - Set `VITE_API_URL` (→ your Render backend URL + `/api/v1`) and `VITE_SOCKET_URL` (→ backend base URL) as Vercel env vars.
   - `client/vercel.json` (already added) handles SPA routing automatically once deployed.

4. **Domains/DNS** (only needed for Deployment Shape A in §2.3; skip for a quick demo on default `*.vercel.app`/`*.onrender.com` hosts using Shape B)
   - CNAME `app.ckclasses.com` → Vercel, `api.ckclasses.com` → Render.
   - Both platforms auto-issue Let's Encrypt TLS certs once DNS is verified.

5. **SMTP for production** — Gmail SMTP works for dev/demo but has real deliverability/rate limits; consider Resend/SendGrid/SES before go-live, especially since OTP emails are on the critical auth path.

6. **Monitoring** — point UptimeRobot (or similar) at `https://<your-backend>/health`, 5-minute interval, alert on non-200.

7. **First backup** — once Atlas is live, do one manual `mongodump` before any real user data is seeded, so there's a known-good restore point from day one.

None of steps 1–7 can be executed by me here — they require your actual cloud accounts. Everything that *could* be prepared in code ahead of time (§2–3) is already done and tested.

---

## 5. Execution order (do these in sequence)

1. Atlas cluster → get `MONGO_URI`.
2. Render service → set all env vars (including `MONGO_URI`) → confirm `/health` → grab deploy hook.
3. Add `RENDER_DEPLOY_HOOK_URL` as a GitHub secret.
4. Vercel project → set `VITE_API_URL`/`VITE_SOCKET_URL` → deploy → confirm site loads.
5. Try a real login from the deployed frontend against the deployed backend — this is the first real test of the CORS + cookie fixes together (see manual test checklist below).
6. Only after that works: point custom domains + redo cookie env vars for Shape A if you want the `.ckclasses.com` setup instead of default hosts.
7. Wire up UptimeRobot.
8. Take the first `mongodump` backup.

---

## MANUAL TEST REQUIRED

I made the code changes and verified them with direct HTTP requests against a locally running server (see §2.1) — but the following can only be verified once real hosting exists, by an actual person in a browser:

1. Deploy backend + frontend per §5 steps 1–4.
2. From the deployed frontend, log in as a seeded test user.
3. Confirm the `ck_access_token` / `ck_refresh_token` cookies appear in browser DevTools → Application → Cookies, with the expected `Domain`, `Secure`, and `SameSite` values for whichever shape (A/B) you chose.
4. Wait 15+ minutes (or clear the access cookie manually) and make a request — confirm the silent refresh in `client/src/services/api.js` kicks in and you stay logged in.
5. Log out — confirm both cookies actually clear in DevTools (this is the exact bug class §2.3 fixes — verify it's really gone).
6. Log in from a second device/browser as the same student account — confirm the session-limit/oldest-session-eviction behavior still works end-to-end over the real network, not just locally.
7. Trigger a password reset end-to-end (real email delivery) — confirm OTP arrives, reset works, and old sessions are revoked.

---

## Files changed/added in this pass

```
modified:   server/src/app.js
modified:   server/server.js
modified:   server/src/routes/authRoutes.js
modified:   server/.env.example
added:      client/vercel.json
added:      .github/workflows/deploy.yml
added:      docs/DEVOPS_DEPLOYMENT_PLAN.md   (this file)
```

A full unified diff of every change is in `devops-changes.patch` alongside this handoff.

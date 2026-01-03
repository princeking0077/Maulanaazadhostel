# Hostinger Shared (Node App) Deployment

This app ships a React frontend (Vite) and an Express backend. The frontend is built into `server/public` and the Node app serves both API and static files.

## Prerequisites
- Hostinger shared plan with Node App feature (Node 18+ recommended).
- MySQL database created; note host, db name, user, password.
- Update environment variables in the Node App panel: `PORT` (Hostinger-assigned), `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`.

## Local build workflow (recommended)
```bash
# From repo root
npm --prefix server run bundle
# bundle = install+build client, sync to server/public, compile TS backend
```
Outputs:
- Frontend assets: `server/public/`
- Backend build: `server/dist/`

If you prefer the manual steps:
```bash
npm --prefix client ci
npm --prefix client run build
node ./sync-frontend.cjs
npm --prefix server ci
npm --prefix server run build:local
```

## Deploy to Hostinger shared Node App (Business Web Hosting)
1) Upload or `git clone` the repo on the server.
2) From the server shell (or via Deploy script), run:
```bash
npm --prefix server ci
npm --prefix server run bundle
```
   This installs dependencies, builds the frontend into `server/public`, and compiles the backend to `server/dist`.
3) In hPanel → Advanced → Node.js:
   - Working directory: `/home/u480091743/domains/learnpharmacy.in/public_html/`
   - Start file: `dist/server.js` (or start script: `npm start`)
   - Node version: 18 or 20
   - Env vars: set `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET` (leave `PORT` empty so Hostinger assigns it)
4) Start (or Restart) the app. The frontend serves from `/` and APIs under `/api`. Health check: `/api/status`.

## Notes
- The Node App feature does not keep background managers like pm2; rely on the hPanel start.
- Re-run `npm --prefix server run bundle` after frontend changes and re-upload `server/public`/`server/dist` (or pull from git and rerun bundle on the server).
- Keep `server/public` in sync with frontend builds before restarting the app.

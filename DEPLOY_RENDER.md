# Deploy to Render (recommended) ✅

This guide shows the fastest, most reliable way to get a public HTTPS URL for the app without owning a domain.

## Why Render
- Managed builds and SSL automatically ✅
- No domain required (you get a *.onrender.com subdomain) 🌐
- Easy auto-deploy on push to `main` 🔁

## Quick steps
1. Ensure the repo is hosted on GitHub and the latest commit is on `main`.
2. Sign in to https://render.com and connect your GitHub account.
3. Create a new **Web Service** and select this repository.
   - **Environment**: Docker
   - **Build command**: (leave empty; Dockerfile is used)
   - **Start command**: `node backend/src/server.js`
   - **Port**: `5000`
   - **Health check path**: `/api/health`
   - **Auto deploy**: enabled
4. Add environment variables in the Render dashboard (Settings -> Environment):
   - `NODE_ENV` = `production`
   - `PORT` = `5000`
   - `JWT_SECRET` = (a long secure secret)
   - (optional) other secrets your app uses (DB connection, etc.)
5. Deploy and monitor the build logs. The app will be available at a `*.onrender.com` URL.

## Notes & tips 💡
- Keep `REACT_APP_API_URL` **unset** so the frontend uses a relative `/api` path when served from the same origin.
- After first deploy, test `https://<your-service>.onrender.com/api/health` and then try logging in from the web UI.

## Want me to finish this for you? 🔧
If your repo is on GitHub and you grant me access (or add a deploy key), I can connect the repo to Render and complete the deploy for you.

---
If you prefer DigitalOcean droplet instead, I already prepared `deploy/cloud-init/do-user-data-digitalocean.yml` and can provision it for you as well, but Render is simplest when you don't have a domain.
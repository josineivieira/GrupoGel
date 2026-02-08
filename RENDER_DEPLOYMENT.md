# 🚀 Render Deployment Guide

Complete guide for deploying the Delivery Documentation App to [Render.com](https://render.com).

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Setup Render Account](#setup-render-account)
3. [Deploy Backend Service](#deploy-backend-service)
4. [Deploy Frontend Service](#deploy-frontend-service)
5. [Configure Database (MongoDB)](#configure-database)
6. [Environment Variables](#environment-variables)
7. [Custom Domain](#custom-domain)
8. [Monitoring & Logs](#monitoring--logs)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- ✅ Render.com account (free tier available)
- ✅ GitHub repository (public or private)
- ✅ Code pushed to GitHub (main branch)
- ✅ MongoDB Atlas account (or local MongoDB for testing)

---

## Setup Render Account

### 1. Create Account

1. Go to [https://render.com](https://render.com)
2. Sign up with GitHub account (recommended for easy integration)
3. Authorize Render to access your repositories

### 2. Connect GitHub Repository

1. In Render dashboard, click **"New +"**
2. Select **"Web Service"**
3. Choose **"Connect a repository"**
4. Search for `josineivieira/GrupoGel`
5. Click **"Connect"**

---

## Deploy Backend Service

### 1. Create Web Service

**Name:** `delivery-app-api`

**Settings:**
- **Repository:** `josineivieira/GrupoGel`
- **Branch:** `main`
- **Root Directory:** (leave empty or set to `.`)
- **Runtime:** `Node`
- **Build Command:** (leave empty - Dockerfile will be used)
- **Start Command:** `npm start`

### 2. Configure Build Settings

- **Dockerfile Path:** `Dockerfile` (default)
- **Dockerfile dir:** (leave empty)
- **Use Docker:** `Yes` (checked)

### 3. Add Environment Variables

Click **"Environment"** and add:

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/delivery-docs?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-key-min-32-chars-generate-with-openssl
REACT_APP_API_URL=https://YOUR-APP-NAME.onrender.com/api
BACKEND_UPLOADS_DIR=/mnt/data/uploads
```

**Generate JWT Secret:**
```bash
openssl rand -hex 32
```

### 4. Create Persistent Disk (for uploads)

1. Click **"Disks"**
2. Click **"Add Disk"**
3. **Mount Path:** `/mnt/data`
4. **Size:** 10 GB (or as needed)
5. Save

### 5. Deploy

Click **"Create Web Service"**

⏳ First deploy takes 3-5 minutes (building Docker image)

✅ Once deployed, you'll get a URL like: `https://delivery-app-api-xxxx.onrender.com`

---

## Deploy Frontend Service

### Option A: As Static Site (Recommended)

**Benefits:**
- Faster performance (CDN)
- Cheaper
- Better for SPA (automatic redirects)
- Separate from backend

### Steps:

1. In Render dashboard, click **"New +"** → **"Static Site"**
2. **Name:** `delivery-app-web`
3. **Repository:** `josineivieira/GrupoGel`
4. **Branch:** `main`
5. **Build Command:** `npm install && npm run build --workspace=frontend`
6. **Publish Directory:** `frontend/build`

### Add Redirect Rule for SPA

⚠️ **CRITICAL for React Router:**

1. In Static Site settings → **"Redirects/Rewrites"**
2. Click **"Add Redirect"**
3. **Source:** `/*`
4. **Destination:** `/index.html`
5. **Status Code:** `200` (permanent rewrite, not 301/302)

This ensures all non-existent routes fall back to `index.html` (SPA behavior).

### Option B: As Web Service (If Building with Backend)

If you want both on one service (not recommended):

1. Keep backend Web Service as-is
2. Frontend will be served from `/` after Dockerfile builds it
3. The included Dockerfile already handles this with multi-stage build

---

## Configure Database (MongoDB)

### Option 1: MongoDB Atlas (Cloud) - Recommended

**Step 1: Create MongoDB Atlas Cluster**

1. Go to [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create account (free tier available)
3. Create a new project
4. Click **"Build a Database"**
5. Choose **"M0"** (free tier)
6. Select region close to your app (e.g., US East)
7. Click **"Create"**

**Step 2: Get Connection String**

1. Click **"Connect"**
2. Choose **"Drivers"**
3. Copy connection string: `mongodb+srv://username:password@...`
4. This becomes your `MONGODB_URI` in Render env variables

**Step 3: Add IP Whitelist**

1. In MongoDB Atlas → **"Network Access"**
2. Click **"Add IP Address"**
3. Select **"Allow Access from Anywhere"** (0.0.0.0/0)
4. Confirm

⚠️ For production, limit IPs to only Render's IP (if you know it) or use IP whitelist restrictions

**Step 4: Create Database User**

1. In MongoDB Atlas → **"Database Access"**
2. Click **"Add Database User"**
3. Create username & strong password
4. Use these in connection string

### Option 2: Self-Hosted MongoDB

If you have your own MongoDB server:
- Ensure it's publicly accessible (firewall rules)
- Use `MONGODB_URI=mongodb://username:password@your-server:27017/delivery-docs`

### Verify Connection

Before deploying, test the connection string:

```bash
mongosh "mongodb+srv://username:password@cluster.mongodb.net/delivery-docs" --eval "db.adminCommand('ping')"
```

---

## Environment Variables

### Required Variables

```env
# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/delivery-docs

# JWT (Generate: openssl rand -hex 32)
JWT_SECRET=generate-strong-random-string-here-32-chars-min

# Node Environment
NODE_ENV=production

# Frontend API URL (use your Render domain)
REACT_APP_API_URL=https://delivery-app-api-xxxx.onrender.com/api

# File Uploads
BACKEND_UPLOADS_DIR=/mnt/data/uploads
```

### Optional Variables

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@delivery-app.com

# Google Drive
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# AWS S3
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket
```

### Set Variables in Render

1. Go to Web Service → **"Environment"**
2. Click **"Add Environment Variable"**
3. Enter key and value
4. Save and redeploy

⚠️ **Never commit .env files!** Use Render's Environment dashboard.

---

## Custom Domain

### Connect Your Domain

1. In Web Service → **"Settings"**
2. Scroll to **"Custom Domain"**
3. Enter your domain: `app.yourdomain.com`
4. Render will give you DNS records to add

### Update DNS

In your domain registrar (GoDaddy, Namecheap, etc.):

1. Add the CNAME record Render provides
2. Wait for DNS propagation (5-24 hours)
3. Render will auto-generate SSL cert

Example CNAME:
```
app.yourdomain.com CNAME delivery-app-api-xxxx.onrender.com
```

---

## Monitoring & Logs

### View Logs

1. In Web Service → **"Logs"**
2. Real-time streaming of server output
3. Filter by time or search for errors

### Common Log Patterns

```
✓ "Server is running on port 5000"  → ✅ Backend started
✗ "ECONNREFUSED"                    → ❌ MongoDB connection failed
✗ "Cannot find module"              → ❌ Missing dependency
✗ "401 Unauthorized"                → ❌ JWT verification failed
```

### Health Checks

Render automatically pings `/api/health` endpoint. You'll see if service is passing health checks in dashboard.

Check manually:
```bash
curl https://delivery-app-api-xxxx.onrender.com/api/health
```

Expected response:
```json
{
  "success": true,
  "message": "Server is running",
  "version": "1.0.0",
  "uptime": 3600,
  "timestamp": "2026-02-07T20:00:00Z",
  "dbMode": "MongoDB"
}
```

---

## Deploy Checklist

Before going to production:

### Code
- [ ] All changes pushed to `main` branch
- [ ] No `console.log` debugging statements left
- [ ] ESLint/Prettier formatting applied
- [ ] No hardcoded secrets in code

### Database
- [ ] MongoDB Atlas account created
- [ ] Database user created with strong password
- [ ] Connection string tested locally
- [ ] Whitelisted Render IP (or 0.0.0.0/0 for testing)

### Environment
- [ ] `NODE_ENV=production`
- [ ] `JWT_SECRET` is secure (min 32 chars, random)
- [ ] `MONGODB_URI` is correct
- [ ] `REACT_APP_API_URL` points to Render domain

### Monitoring
- [ ] Health check endpoint `/api/health` responds
- [ ] Logs show app starting without errors
- [ ] Can login with test credentials
- [ ] Can create and submit a delivery
- [ ] Uploads work and persist after restart

### Security
- [ ] Custom domain configured with HTTPS
- [ ] No IP whitelisting issues
- [ ] SSL certificate auto-renewed
- [ ] Secrets not exposed in git history

---

## Troubleshooting

### Deploy Fails: "npm install failed"

**Cause:** Unsupported engine or dependency issue

**Solution:**
1. Check Dockerfile uses Node 20+
2. Run `npm install` locally to verify
3. Check for any `npm ERR!` in console
4. Try: `npm ci` instead of `npm install`

### Deploy Fails: "Docker build failed"

**Solution:**
1. Test build locally: `docker build -t app .`
2. Check Dockerfile syntax
3. Verify all COPY paths exist
4. Check for large files (>100MB)

### App Starts but Returns 503

**Cause:** MongoDB connection failed

**Solution:**
1. Verify `MONGODB_URI` in Environment variables
2. Test connection string locally
3. Check IP whitelist in MongoDB Atlas (allow 0.0.0.0/0 for testing)
4. Check Database user password (special chars need URL encoding)

### Uploads Return 404 or Fail

**Cause:** Persistent disk not mounted correctly

**Solution:**
1. Verify disk exists in Web Service → "Disks"
2. Check `BACKEND_UPLOADS_DIR=/mnt/data/uploads` is set
3. Ensure disk mount path matches code expectations
4. Restart service to remount

### Performance Issues

**Causes & Solutions:**

| Issue | Solution |
|-------|----------|
| Slow startup | Increase disk space, clear build cache |
| Timeouts on uploads | Increase request timeout in Express |
| Memory issues | Reduce node_modules size, upgrade plan |
| Slow queries | Create MongoDB indexes, upgrade cluster |

### Frontend Shows 404 on Refresh

**Cause:** SPA fallback not configured

**Solution:**
1. If using Static Site: Add Redirect rule (`/*` → `/index.html`, status 200)
2. If using Web Service: Dockerfile must serve index.html for missing routes

### Secure Connection Fails (SSL)

**Solution:**
1. Let Render auto-generate SSL (usually works)
2. If custom domain: Check DNS CNAME is correct
3. Wait for DNS propagation (up to 24h)
4. Force HTTPS in code: add Helmet headers (already included)

---

## Scripts for Common Tasks

### Deploy a Fix

```bash
# Make changes
git add .
git commit -m "fix: description"
git push origin main

# Render auto-detects and redeploys
# Check dashboard: Web Service → Deploys
```

### Run Migration on Render

Only necessary after major updates. Use Render's shell:

1. Go to Web Service → **"Shell"**
2. Run: `npm run migrate-data`
3. Check output for success

### Check Real-Time Logs

```bash
# SSH into Render (if available)
# Or view in dashboard: Web Service → Logs
# Tail last 100 lines and follow new entries
```

### Restart Service

1. Go to Web Service → **"Settings"**
2. Click **"Restart Service"**
3. Waits for new instance to start

---

## Support & Resources

- **Render Docs:** https://render.com/docs
- **MongoDB Atlas:** https://docs.mongodb.com/atlas/
- **Node.js Production:** https://nodejs.org/en/docs/guides/nodejs-docker-webapp/
- **GitHub Actions:** https://github.com/features/actions

---

**Questions?** Check logs first, then reach out on GitHub Issues.

🎉 **Congratulations!** Your app is now deployed to production!

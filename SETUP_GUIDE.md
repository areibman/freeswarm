# 🚀 FreeSwarm PR Manager - Complete Setup Guide

This guide will walk you through setting up both the frontend and backend of the FreeSwarm PR Manager.

## 📋 Prerequisites

- **Node.js 18+** and npm/yarn
- **Git** installed
- **GitHub Account** with access to repositories you want to manage
- **SQLite3** (usually comes pre-installed)

## 🏗️ Architecture Overview

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│                 │         │                 │         │                 │
│   Next.js       │ <-----> │   Express       │ <-----> │   GitHub API    │
│   Frontend      │         │   Backend       │         │                 │
│   (Port 3000)   │         │   (Port 3001)   │         │                 │
│                 │         │                 │         │                 │
└─────────────────┘         └─────────────────┘         └─────────────────┘
        ↑                           ↑
        │                           │
        │                      ┌────┴────┐
        └──── WebSocket ───────│ SQLite  │
                               │ Cache   │
                               └─────────┘
```

## 🎯 Quick Start (Development Mode)

### Step 1: Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd freeswarm

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### Step 2: Configure Environment Variables

#### Backend Configuration

```bash
cd backend
cp env.example .env
# Edit .env with your GitHub credentials
```

**Minimal backend `.env` for development:**

```env
# Server
PORT=3001
NODE_ENV=development

# GitHub (Choose one method)
# Method 1: Personal Access Token (Easier)
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx

# Method 2: GitHub App (More secure, better for production)
# GITHUB_APP_ID=123456
# GITHUB_CLIENT_ID=Iv1.xxxxxxxxxx
# GITHUB_CLIENT_SECRET=xxxxxxxxxx
# GITHUB_WEBHOOK_SECRET=your_webhook_secret

# Database
DATABASE_URL=sqlite://./data/database.sqlite

# Security (Generate with: openssl rand -base64 32)
JWT_SECRET=changethisinproduction123456789

# CORS
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000

# Cache
CACHE_TTL_SECONDS=300
```

#### Frontend Configuration

```bash
# In root directory
cp frontend.env.example .env.local
```

**Minimal frontend `.env.local` for development:**

```env
# Backend API
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=http://localhost:3001

# Features
NEXT_PUBLIC_ENABLE_WEBSOCKET=true
NEXT_PUBLIC_AUTO_REFRESH=true
NEXT_PUBLIC_REFRESH_INTERVAL=60000
```

### Step 3: Start Both Services

Open two terminal windows:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Backend starts at http://localhost:3001
```

**Terminal 2 - Frontend:**
```bash
# In root directory
npm run dev
# Frontend starts at http://localhost:3000
```

### Step 4: Access the Application

Open your browser and go to `http://localhost:3000`

## 🔑 GitHub Authentication Setup

### Option 1: Personal Access Token (Quick Setup)

1. Go to [GitHub Settings > Developer Settings > Personal Access Tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Name: "FreeSwarm PR Manager"
4. Select scopes:
   - `repo` (Full control of private repositories)
   - `read:org` (Read org and team membership)
5. Generate token and copy it
6. Add to backend `.env`:
   ```env
   GITHUB_PERSONAL_ACCESS_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
   ```

### Option 2: GitHub App (Production Ready)

1. Go to [GitHub Settings > Developer Settings > GitHub Apps](https://github.com/settings/apps)
2. Click "New GitHub App"
3. Configure:
   - **Name**: FreeSwarm PR Manager
   - **Homepage URL**: http://localhost:3000
   - **Webhook URL**: https://your-domain.com/api/webhooks/github
   - **Webhook Secret**: Generate a random string
4. Set Permissions:
   - **Pull requests**: Read & Write
   - **Issues**: Read
   - **Repository metadata**: Read
   - **Commit statuses**: Read
5. Subscribe to events:
   - Pull request
   - Pull request review
   - Issues
6. Create the app and note down:
   - App ID
   - Client ID
   - Client Secret
7. Generate a private key
8. Add to backend `.env`:
   ```env
   GITHUB_APP_ID=123456
   GITHUB_CLIENT_ID=Iv1.xxxxxxxxxx
   GITHUB_CLIENT_SECRET=xxxxxxxxxx
   GITHUB_WEBHOOK_SECRET=your_webhook_secret
   ```

## 🌐 Production Deployment

### Backend Deployment (Example with PM2)

```bash
cd backend

# Build
npm run build

# Install PM2
npm install -g pm2

# Start with PM2
pm2 start dist/index.js --name freeswarm-backend

# Save PM2 configuration
pm2 save
pm2 startup
```

### Frontend Deployment (Example with Vercel)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

### Nginx Configuration (for self-hosting)

```nginx
# Frontend
server {
    listen 80;
    server_name freeswarm.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# Backend API
server {
    listen 80;
    server_name api.freeswarm.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🧪 Testing the Setup

### 1. Check Backend Health
```bash
curl http://localhost:3001/health
# Should return: {"status":"ok","timestamp":"..."}
```

### 2. Test GitHub Connection
```bash
curl http://localhost:3001/api/repositories \
  -H "Authorization: Bearer your_token"
# Should return list of repositories
```

### 3. Check WebSocket Connection
Open browser console on frontend and look for:
```
WebSocket connected
```

## 🐛 Troubleshooting

### Frontend can't connect to backend

1. Check backend is running: `curl http://localhost:3001/health`
2. Check CORS settings in backend `.env`
3. Verify `NEXT_PUBLIC_API_URL` in frontend `.env.local`

### GitHub API errors

1. Verify your token/app credentials
2. Check GitHub API rate limits
3. Ensure token has correct permissions

### WebSocket connection fails

1. Check `NEXT_PUBLIC_WS_URL` matches backend URL
2. Ensure `ENABLE_WEBSOCKET=true` in backend
3. Check firewall/proxy settings

### Database errors

1. Create data directory: `mkdir backend/data`
2. Check write permissions
3. Delete `database.sqlite` and restart to recreate

## 📊 Environment Variables Reference

### Backend Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `PORT` | Yes | Backend server port | `3001` |
| `NODE_ENV` | Yes | Environment mode | `development` or `production` |
| `GITHUB_PERSONAL_ACCESS_TOKEN` | Yes* | GitHub PAT | `ghp_xxxxx` |
| `GITHUB_APP_ID` | Yes* | GitHub App ID | `123456` |
| `DATABASE_URL` | Yes | SQLite database path | `sqlite://./data/database.sqlite` |
| `JWT_SECRET` | Yes | JWT signing secret | Random 32+ char string |
| `FRONTEND_URL` | Yes | Frontend URL for CORS | `http://localhost:3000` |

*Either PAT or GitHub App credentials required

### Frontend Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Yes | Backend API URL | `http://localhost:3001` |
| `NEXT_PUBLIC_WS_URL` | Yes | WebSocket URL | `http://localhost:3001` |
| `NEXT_PUBLIC_ENABLE_WEBSOCKET` | No | Enable real-time updates | `true` |
| `NEXT_PUBLIC_AUTO_REFRESH` | No | Enable auto-refresh | `true` |

## 🚢 Docker Deployment (Optional)

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
    env_file:
      - ./backend/.env
    volumes:
      - ./backend/data:/app/data
      - ./backend/logs:/app/logs

  frontend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - ./.env.local
    depends_on:
      - backend
```

Run with:
```bash
docker-compose up -d
```

## 📚 Additional Resources

- [GitHub Apps Documentation](https://docs.github.com/en/developers/apps)
- [GitHub REST API Reference](https://docs.github.com/en/rest)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Express Best Practices](https://expressjs.com/en/advanced/best-practice-production.html)

## 🆘 Getting Help

1. Check the [troubleshooting section](#-troubleshooting)
2. Review backend logs: `tail -f backend/logs/backend.log`
3. Enable debug mode: Set `NEXT_PUBLIC_DEBUG=true` and `LOG_LEVEL=debug`
4. Open an issue on GitHub with:
   - Error messages
   - Environment configuration (without secrets)
   - Steps to reproduce

## ✅ Verification Checklist

- [ ] Backend health check returns OK
- [ ] Frontend loads without errors
- [ ] GitHub repositories are fetched
- [ ] WebSocket connects successfully
- [ ] Pull requests are displayed
- [ ] Real-time updates work (if using webhooks)
- [ ] Caching works (check cache stats endpoint)

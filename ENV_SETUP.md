# 🔧 Environment Configuration Guide

This document explains all environment variables needed for the FreeSwarm PR Manager.

## 📁 Configuration Files

```
freeswarm/
├── .env.local              # Frontend environment variables
├── frontend.env.example    # Frontend example configuration
├── backend/
│   ├── .env               # Backend environment variables (create from env.example)
│   └── env.example        # Backend example configuration
└── setup.sh               # Automated setup script
```

## 🚀 Quick Setup

### Automated Setup (Recommended)

Run the setup script for automatic configuration:

```bash
./setup.sh
```

This script will:
- ✅ Check Node.js version
- ✅ Install all dependencies
- ✅ Create environment files
- ✅ Generate secure JWT secret
- ✅ Help configure GitHub authentication
- ✅ Build the backend
- ✅ Optionally start both services

### Manual Setup

1. **Copy environment templates:**
```bash
# Frontend
cp frontend.env.example .env.local

# Backend
cp backend/env.example backend/.env
```

2. **Configure Backend (`backend/.env`):**

```env
# Essential Configuration
PORT=3001
NODE_ENV=development
DATABASE_URL=sqlite://./data/database.sqlite

# GitHub Authentication (choose one method)
# Option 1: Personal Access Token
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_xxxxxxxxxxxx

# Option 2: GitHub App
# GITHUB_APP_ID=123456
# GITHUB_CLIENT_ID=Iv1.xxxxxxxxxx
# GITHUB_CLIENT_SECRET=xxxxxxxxxx

# Security (generate with: openssl rand -base64 32)
JWT_SECRET=your_secure_random_string_here

# CORS
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000
```

3. **Configure Frontend (`.env.local`):**

```env
# Backend Connection
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=http://localhost:3001

# Features
NEXT_PUBLIC_ENABLE_WEBSOCKET=true
NEXT_PUBLIC_AUTO_REFRESH=true
```

## 🔑 GitHub Authentication Methods

### Method 1: Personal Access Token (Development)

**Pros:** Quick setup, good for development
**Cons:** Less secure, limited rate limits

1. Go to: https://github.com/settings/tokens
2. Generate new token (classic)
3. Required scopes:
   - `repo` - Full control of private repositories
   - `read:org` - Read organization membership
4. Add to `backend/.env`:
   ```env
   GITHUB_PERSONAL_ACCESS_TOKEN=ghp_your_token_here
   ```

### Method 2: GitHub App (Production)

**Pros:** More secure, higher rate limits, webhook support
**Cons:** More complex setup

1. Create GitHub App: https://github.com/settings/apps
2. Configure permissions:
   - Pull requests: Read & Write
   - Issues: Read
   - Repository metadata: Read
3. Add credentials to `backend/.env`:
   ```env
   GITHUB_APP_ID=123456
   GITHUB_CLIENT_ID=Iv1.xxxxxxxxxx
   GITHUB_CLIENT_SECRET=xxxxxxxxxx
   GITHUB_WEBHOOK_SECRET=your_webhook_secret
   ```

## 🌍 Environment Variables Reference

### Backend Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| **Server** | | | |
| `PORT` | No | 3001 | Server port |
| `NODE_ENV` | Yes | - | development/production |
| **GitHub Auth** | | | |
| `GITHUB_PERSONAL_ACCESS_TOKEN` | Yes* | - | GitHub PAT |
| `GITHUB_APP_ID` | Yes* | - | GitHub App ID |
| `GITHUB_CLIENT_ID` | Yes* | - | GitHub OAuth Client ID |
| `GITHUB_CLIENT_SECRET` | Yes* | - | GitHub OAuth Secret |
| `GITHUB_WEBHOOK_SECRET` | No | - | Webhook verification |
| **Database** | | | |
| `DATABASE_URL` | Yes | - | SQLite connection string |
| **Security** | | | |
| `JWT_SECRET` | Yes | - | JWT signing key |
| `JWT_EXPIRES_IN` | No | 7d | Token expiry |
| **CORS** | | | |
| `FRONTEND_URL` | Yes | - | Frontend URL |
| `ALLOWED_ORIGINS` | Yes | - | Comma-separated origins |
| **Rate Limiting** | | | |
| `RATE_LIMIT_WINDOW_MS` | No | 900000 | Rate limit window (ms) |
| `RATE_LIMIT_MAX_REQUESTS` | No | 100 | Max requests per window |
| **Cache** | | | |
| `CACHE_TTL_SECONDS` | No | 300 | Cache TTL in seconds |
| `MAX_CACHE_SIZE_MB` | No | 100 | Max cache size |
| **WebSocket** | | | |
| `ENABLE_WEBSOCKET` | No | true | Enable WebSocket |
| `WS_PING_INTERVAL` | No | 30000 | Ping interval (ms) |
| **Logging** | | | |
| `LOG_LEVEL` | No | info | error/warn/info/debug |
| `LOG_TO_FILE` | No | false | Log to file |
| `LOG_FILE_PATH` | No | ./logs/backend.log | Log file path |

*Either Personal Access Token OR GitHub App credentials required

### Frontend Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| **API Configuration** | | | |
| `NEXT_PUBLIC_API_URL` | Yes | - | Backend API URL |
| `NEXT_PUBLIC_WS_URL` | Yes | - | WebSocket URL |
| **Features** | | | |
| `NEXT_PUBLIC_ENABLE_WEBSOCKET` | No | true | Real-time updates |
| `NEXT_PUBLIC_AUTO_REFRESH` | No | true | Auto-refresh data |
| `NEXT_PUBLIC_REFRESH_INTERVAL` | No | 60000 | Refresh interval (ms) |
| **UI** | | | |
| `NEXT_PUBLIC_DEFAULT_THEME` | No | light | Default theme |
| `NEXT_PUBLIC_DEBUG` | No | false | Debug mode |

## 🔒 Security Best Practices

1. **Never commit `.env` files** - They're in `.gitignore` for a reason
2. **Use strong secrets** - Generate with `openssl rand -base64 32`
3. **Rotate tokens regularly** - Especially in production
4. **Use GitHub Apps in production** - More secure than PATs
5. **Enable HTTPS in production** - Use SSL certificates
6. **Set proper CORS origins** - Don't use wildcards in production

## 🐳 Docker Environment

For Docker deployments, use environment variables in `docker-compose.yml`:

```yaml
services:
  backend:
    environment:
      - NODE_ENV=production
      - PORT=3001
      # Add other variables or use env_file
    env_file:
      - ./backend/.env.production
```

## 🚨 Common Issues

### "GitHub API rate limit exceeded"
- **Solution:** Use GitHub App instead of PAT for higher limits

### "CORS error in browser"
- **Solution:** Check `ALLOWED_ORIGINS` includes your frontend URL

### "WebSocket connection failed"
- **Solution:** Ensure `NEXT_PUBLIC_WS_URL` matches backend URL

### "Database locked"
- **Solution:** Ensure only one backend instance accesses SQLite

### "JWT invalid signature"
- **Solution:** Ensure `JWT_SECRET` is the same across restarts

## 📝 Example Configurations

### Development Setup
```bash
# backend/.env
NODE_ENV=development
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_development_token
JWT_SECRET=dev_secret_change_in_production
FRONTEND_URL=http://localhost:3000

# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_DEBUG=true
```

### Production Setup
```bash
# backend/.env
NODE_ENV=production
GITHUB_APP_ID=123456
GITHUB_CLIENT_ID=Iv1.production
GITHUB_CLIENT_SECRET=production_secret
JWT_SECRET=strong_random_production_secret
FRONTEND_URL=https://freeswarm.yourdomain.com
ALLOWED_ORIGINS=https://freeswarm.yourdomain.com

# .env.local
NEXT_PUBLIC_API_URL=https://api.freeswarm.yourdomain.com
NEXT_PUBLIC_WS_URL=wss://api.freeswarm.yourdomain.com
NEXT_PUBLIC_DEBUG=false
```

## 📚 Additional Resources

- [GitHub Personal Access Tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [GitHub Apps Documentation](https://docs.github.com/en/developers/apps/getting-started-with-apps/about-apps)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Express Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

# FreeSwarm PR Manager

This project tracks and manages PRs across GitHub repositories with a modern Next.js frontend and an Express backend.

## Sign in with GitHub

- Click "Continue with GitHub" to authenticate via OAuth
- The backend sets an HTTP-only session cookie
- All API calls from the frontend include credentials and use the session

Backend endpoints:
- GET `/auth/github/login` → Redirects to GitHub OAuth
- GET `/auth/github/callback` → Handles OAuth callback, sets cookie, redirects to frontend
- GET `/auth/session` → Returns session status
- POST `/auth/logout` → Clears session cookie

## Connect repositories

After signing in, the app fetches your accessible repositories from GitHub via your session token. Configure the specific repositories to track in `src/config/github.config.ts` by setting `mode: 'api'` and the `owner`/`repo` pair(s) you want to monitor.

For multi-repo support, pass a list to the hook or extend the provider to store selected repos per user.

See `ENV_SETUP.md` and `backend/env.example` for required environment variables, including GitHub OAuth credentials and cookie settings.

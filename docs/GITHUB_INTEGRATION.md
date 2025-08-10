# GitHub Integration

## OAuth Login

- Configure `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` in `backend/.env`
- Start backend and frontend
- Frontend calls `GET /auth/github/login` to start sign-in
- Backend handles `GET /auth/github/callback`, sets an HTTP-only cookie
- Session status: `GET /auth/session`

## Connecting Repositories

- Use `GET /api/repositories` to list user-accessible repositories via OAuth token
- Persist connected repos per user with:
  - GET `/api/user/connected-repositories`
  - POST `/api/user/connected-repositories` with `{ repositories: ["owner/repo", ...] }`

These are stored in SQLite tables `users` and `user_repositories`.

## Scopes

Request the following scopes in the OAuth redirect to enable full functionality:
- `read:user` `user:email` `repo`

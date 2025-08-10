# GitHub OAuth Setup Guide

This guide will help you set up GitHub OAuth authentication for FreeSwarm.

## Step 1: Create a GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the following details:
   - **Application name**: `FreeSwarm PR Manager`
   - **Homepage URL**: `http://localhost:3000` (for development)
   - **Application description**: `A pull request management tool for GitHub`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`

4. Click "Register application"
5. Copy the **Client ID** and **Client Secret** (you'll need these for the environment variables)

## Step 2: Configure Environment Variables

### Frontend (.env.local)

Create a `.env.local` file in the root directory with the following variables:

```env
# GitHub OAuth App credentials
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here

# NextAuth secret (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET=your_generated_secret_here

# NextAuth URL
NEXTAUTH_URL=http://localhost:3000

# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=http://localhost:3001
```

### Backend (.env)

Create a `.env` file in the `backend` directory:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# GitHub OAuth App credentials (same as frontend)
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here

# Security Configuration
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d

# CORS Configuration
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Database Configuration
DATABASE_URL=sqlite://./data/database.sqlite

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Cache Configuration
CACHE_TTL_SECONDS=300
MAX_CACHE_SIZE_MB=100

# WebSocket Configuration
ENABLE_WEBSOCKET=true
WS_PING_INTERVAL=30000

# Logging
LOG_LEVEL=info
```

## Step 3: Generate Secrets

### NextAuth Secret
```bash
openssl rand -base64 32
```

### JWT Secret
```bash
openssl rand -base64 32
```

## Step 4: Start the Application

1. **Start the backend server**:
   ```bash
   cd backend
   npm install
   npm run dev
   ```

2. **Start the frontend**:
   ```bash
   npm install
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:3000`

## Step 5: Test the Authentication

1. Click "Sign in with GitHub" on the homepage
2. You should be redirected to GitHub for authorization
3. After authorizing, you'll be redirected back to FreeSwarm
4. You should now see your GitHub profile information and be able to manage repositories

## Production Deployment

For production deployment, you'll need to:

1. **Update GitHub OAuth App settings**:
   - Change the Homepage URL to your production domain
   - Change the Authorization callback URL to `https://yourdomain.com/api/auth/callback/github`

2. **Update environment variables**:
   - Set `NEXTAUTH_URL` to your production URL
   - Set `FRONTEND_URL` and `ALLOWED_ORIGINS` to your production domain
   - Use strong, unique secrets for `NEXTAUTH_SECRET` and `JWT_SECRET`

3. **Security considerations**:
   - Never commit `.env` files to version control
   - Use environment-specific secrets
   - Enable HTTPS in production
   - Consider using a proper database (PostgreSQL, MySQL) instead of SQLite for production

## Troubleshooting

### Common Issues

1. **"Invalid client" error**:
   - Check that your `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` are correct
   - Ensure the callback URL in GitHub matches your `NEXTAUTH_URL`

2. **CORS errors**:
   - Verify that `ALLOWED_ORIGINS` includes your frontend URL
   - Check that `FRONTEND_URL` is set correctly

3. **Database errors**:
   - Ensure the `data` directory exists and is writable
   - Check that SQLite is properly installed

4. **Authentication not working**:
   - Verify that `NEXTAUTH_SECRET` is set and unique
   - Check that `NEXTAUTH_URL` matches your application URL

### Debug Mode

To enable debug logging, add to your `.env.local`:
```env
NEXTAUTH_DEBUG=true
```

## Repository Permissions

The OAuth app requests the following scopes:
- `read:user` - Read user profile information
- `user:email` - Read user email addresses
- `repo` - Full access to repositories (for managing PRs)

Users can choose which repositories to connect when they sign in.

## Security Notes

- The access token is stored securely in the session
- Tokens are automatically refreshed when needed
- Users can revoke access at any time through their GitHub settings
- The application only requests the minimum necessary permissions
# GitHub OAuth Authentication Setup

This guide explains how to set up GitHub OAuth authentication for the FreeSwarm PR Manager application.

## Overview

The application now supports GitHub OAuth authentication, allowing users to:
- Sign in with their GitHub account
- Connect multiple repositories
- Manage pull requests across connected repositories
- Securely access GitHub data without sharing personal access tokens

## Architecture

### Backend Components

1. **Authentication Controller** (`/backend/src/controllers/auth.controller.ts`)
   - Handles OAuth flow initiation
   - Processes GitHub OAuth callbacks
   - Manages user sessions and JWT tokens
   - Repository connection/disconnection

2. **GitHub OAuth Service** (`/backend/src/services/github-oauth.service.ts`)
   - Manages OAuth authorization URLs
   - Exchanges authorization codes for access tokens
   - Fetches user data from GitHub
   - Verifies repository access

3. **Auth Service** (`/backend/src/services/auth.service.ts`)
   - User database management
   - User creation and updates
   - Repository connection tracking

4. **Authentication Middleware** (`/backend/src/middleware/auth.middleware.ts`)
   - JWT token verification
   - Route protection
   - User context injection

### Frontend Components

1. **Auth Context** (`/src/contexts/AuthContext.tsx`)
   - Global authentication state management
   - Login/logout functionality
   - Repository connection management
   - User data caching

2. **Login Page** (`/src/app/login/page.tsx`)
   - GitHub OAuth sign-in interface
   - Feature showcase

3. **Dashboard** (`/src/app/dashboard/page.tsx`)
   - User profile display
   - Repository management interface
   - Connected repositories overview

4. **OAuth Callback** (`/src/app/auth/callback/page.tsx`)
   - Handles OAuth redirect from GitHub
   - Token storage
   - User redirection

## Setup Instructions

### 1. Create a GitHub OAuth App

1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Click "New OAuth App"
3. Fill in the application details:
   - **Application name**: FreeSwarm PR Manager
   - **Homepage URL**: http://localhost:3000 (or your production URL)
   - **Authorization callback URL**: http://localhost:3001/api/auth/github/callback
4. Click "Register application"
5. Note down the **Client ID**
6. Generate and note down a **Client Secret**

### 2. Configure Environment Variables

#### Backend (.env)

```bash
# GitHub OAuth Configuration
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=3001
BACKEND_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL=sqlite://./data/database.sqlite

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

#### Frontend (.env.local)

```bash
# Backend API
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=http://localhost:3001

# Optional: Override GitHub mode
NEXT_PUBLIC_GITHUB_MODE=api
```

### 3. Install Dependencies

The authentication system requires the following packages (already included in package.json):

**Backend:**
- jsonwebtoken - JWT token generation and verification
- bcryptjs - Password hashing (for future use)
- @octokit/rest - GitHub API client
- axios - HTTP client for OAuth token exchange

**Frontend:**
- Already uses Next.js built-in features

### 4. Database Setup

The application automatically creates the necessary database tables on startup. The user table schema includes:

- `id` - Primary key
- `github_id` - GitHub user ID
- `username` - GitHub username
- `email` - User email
- `name` - User's full name
- `avatar_url` - Profile picture URL
- `github_access_token` - OAuth access token
- `connected_repos` - JSON array of connected repositories
- `created_at` - Account creation timestamp
- `updated_at` - Last update timestamp

## Authentication Flow

1. **User initiates login**
   - User clicks "Sign in with GitHub" button
   - Frontend redirects to `/api/auth/github`

2. **Backend redirects to GitHub**
   - Backend generates GitHub OAuth URL
   - User is redirected to GitHub for authorization

3. **GitHub authorization**
   - User authorizes the application
   - GitHub redirects back with authorization code

4. **Token exchange**
   - Backend exchanges code for access token
   - Fetches user data from GitHub
   - Creates/updates user in database

5. **JWT generation**
   - Backend generates JWT token
   - Redirects to frontend with token

6. **Frontend authentication**
   - Frontend stores JWT token in localStorage
   - Uses token for authenticated API requests
   - Maintains user session

## API Endpoints

### Authentication Endpoints

- `GET /api/auth/github` - Initiate GitHub OAuth flow
- `GET /api/auth/github/callback` - Handle OAuth callback
- `GET /api/auth/user` - Get current user info (protected)
- `POST /api/auth/logout` - Logout user (protected)

### Repository Management

- `GET /api/user/repositories` - Get connected repositories (protected)
- `POST /api/user/repositories` - Connect a repository (protected)
- `DELETE /api/user/repositories/:owner/:repo` - Disconnect repository (protected)

### Protected Endpoints

All endpoints that modify data now require authentication:
- `PUT /api/repos/:owner/:repo/pull-requests/:prNumber/status`
- `POST /api/repos/:owner/:repo/pull-requests/:prNumber/comments`
- `GET /api/repositories` - Fetches user's GitHub repositories

## Security Considerations

1. **JWT Security**
   - Use a strong, random JWT secret
   - Set appropriate token expiration
   - Store tokens securely in the frontend

2. **OAuth Security**
   - Keep Client Secret secure
   - Use HTTPS in production
   - Validate OAuth state parameter (implement if needed)

3. **CORS Configuration**
   - Restrict allowed origins
   - Configure appropriate headers

4. **Rate Limiting**
   - API endpoints are rate-limited
   - Adjust limits based on usage

## Troubleshooting

### Common Issues

1. **"GitHub OAuth credentials not configured" error**
   - Ensure `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` are set in backend .env

2. **Authentication redirect fails**
   - Check that callback URL in GitHub app matches backend URL
   - Verify CORS settings allow frontend origin

3. **Token verification fails**
   - Ensure `JWT_SECRET` is set and consistent
   - Check token expiration settings

4. **Cannot connect repositories**
   - Verify GitHub OAuth app has necessary scopes
   - Check user has access to the repository

### Debug Mode

Enable debug logging by setting:
```bash
DEBUG=true
LOG_LEVEL=debug
```

## Production Deployment

For production deployment:

1. Update OAuth app callback URL to production domain
2. Use HTTPS for all URLs
3. Set secure environment variables
4. Use a production database (PostgreSQL recommended)
5. Implement rate limiting and monitoring
6. Add error tracking (Sentry, etc.)
7. Consider implementing refresh tokens

## Future Enhancements

Potential improvements to the authentication system:

1. **Refresh Tokens** - Implement refresh token rotation
2. **OAuth State Validation** - Add CSRF protection
3. **Multi-factor Authentication** - Add 2FA support
4. **Session Management** - Add session invalidation
5. **Audit Logging** - Track authentication events
6. **Organization Support** - Handle GitHub organization repositories
7. **Fine-grained Permissions** - Implement role-based access control
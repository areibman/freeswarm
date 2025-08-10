# GitHub OAuth Setup Guide

This guide will walk you through setting up GitHub OAuth authentication for FreeSwarm.

## Overview

The app now uses GitHub OAuth instead of personal access tokens, providing:
- Secure user authentication through GitHub
- Automatic token management and refresh
- User-specific repository access
- Granular permission control

## Prerequisites

- A GitHub account
- Admin access to create GitHub OAuth Apps
- Node.js and npm installed

## Step 1: Create a GitHub OAuth App

1. **Go to GitHub Developer Settings**
   - Navigate to [GitHub Settings > Developer settings > OAuth Apps](https://github.com/settings/developers)
   - Or go to: Settings → Developer settings → OAuth Apps

2. **Create a New OAuth App**
   - Click "New OAuth App"
   - Fill in the application details:

   ```
   Application name: FreeSwarm PR Manager
   Homepage URL: http://localhost:3000 (for development)
   Application description: Multi-agent PR competition tracker
   Authorization callback URL: http://localhost:3000/api/auth/callback/github
   ```

   > **Note**: For production, replace `localhost:3000` with your actual domain.

3. **Save the App**
   - Click "Register application"
   - You'll be redirected to your app's settings page

4. **Get Your Credentials**
   - Copy the **Client ID** (visible immediately)
   - Click "Generate a new client secret" and copy the **Client Secret**
   - **Important**: Save the client secret immediately - you won't be able to see it again!

## Step 2: Configure Environment Variables

### Frontend Configuration

1. **Copy the frontend environment template:**
   ```bash
   cp frontend.env.example .env.local
   ```

2. **Update `.env.local` with your GitHub OAuth credentials:**
   ```env
   # Backend API Configuration
   NEXT_PUBLIC_API_URL=http://localhost:3001
   NEXT_PUBLIC_WS_URL=http://localhost:3001

   # NextAuth.js Configuration
   NEXTAUTH_SECRET=your_super_secret_nextauth_key_here
   NEXTAUTH_URL=http://localhost:3000

   # GitHub OAuth App credentials
   GITHUB_CLIENT_ID=your_github_client_id_here
   GITHUB_CLIENT_SECRET=your_github_client_secret_here
   ```

   > **Generate NEXTAUTH_SECRET**: Run `openssl rand -base64 32` to generate a secure secret.

### Backend Configuration

1. **Copy the backend environment template:**
   ```bash
   cd backend
   cp env.example .env
   ```

2. **Update `backend/.env` with the same GitHub credentials:**
   ```env
   # Server Configuration
   PORT=3001
   NODE_ENV=development

   # GitHub App Configuration (same as frontend)
   GITHUB_CLIENT_ID=your_github_client_id_here
   GITHUB_CLIENT_SECRET=your_github_client_secret_here

   # Database Configuration
   DATABASE_URL=sqlite://./data/database.sqlite

   # Security Configuration
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
   JWT_EXPIRES_IN=7d

   # CORS Configuration
   FRONTEND_URL=http://localhost:3000
   ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
   ```

## Step 3: Install Dependencies and Start the Application

1. **Install frontend dependencies:**
   ```bash
   npm install
   ```

2. **Install backend dependencies:**
   ```bash
   cd backend
   npm install
   cd ..
   ```

3. **Start the backend server:**
   ```bash
   cd backend
   npm run dev
   ```

4. **Start the frontend (in a new terminal):**
   ```bash
   npm run dev
   ```

## Step 4: Test the Authentication Flow

1. **Open the application:**
   - Go to [http://localhost:3000](http://localhost:3000)

2. **Sign in:**
   - Click "Sign in with GitHub"
   - You'll be redirected to GitHub for authorization
   - Grant the requested permissions
   - You'll be redirected back to the app

3. **Connect repositories:**
   - Navigate to the "Repositories" page
   - Connect the repositories you want to manage
   - Start viewing pull requests!

## Production Deployment

### Update OAuth App Settings

1. **Update your GitHub OAuth App:**
   - Go back to your OAuth App settings
   - Update the **Homepage URL** to your production domain
   - Update the **Authorization callback URL** to: `https://yourdomain.com/api/auth/callback/github`

### Update Environment Variables

1. **Update frontend `.env.local` (or deployment environment):**
   ```env
   NEXTAUTH_URL=https://yourdomain.com
   NEXT_PUBLIC_API_URL=https://yourdomain.com/api
   ```

2. **Update backend `.env`:**
   ```env
   NODE_ENV=production
   FRONTEND_URL=https://yourdomain.com
   ALLOWED_ORIGINS=https://yourdomain.com
   ```

## Security Considerations

### Environment Variables
- Never commit `.env` files to version control
- Use different OAuth apps for development and production
- Rotate secrets regularly in production

### OAuth Scopes
The app requests these GitHub scopes:
- `read:user` - Access to user profile information
- `user:email` - Access to user email addresses
- `repo` - Access to public and private repositories

### Database Security
- The SQLite database stores user tokens securely
- Tokens are encrypted and only accessible by the backend
- User sessions are managed through secure JWT tokens

## Troubleshooting

### Common Issues

1. **"Invalid client" error:**
   - Check that your Client ID and Client Secret are correct
   - Ensure the callback URL matches exactly (including protocol)

2. **"Access denied" error:**
   - User may have denied permissions during OAuth flow
   - Check that the OAuth app has the correct scopes

3. **"Token expired" errors:**
   - The app will automatically handle token refresh
   - If issues persist, users can sign out and sign in again

4. **CORS errors:**
   - Ensure `ALLOWED_ORIGINS` in backend includes your frontend URL
   - Check that both frontend and backend are running

### Debug Mode

Enable debug logging by setting:
```env
# Frontend
NEXT_PUBLIC_DEBUG=true

# Backend
DEBUG=true
LOG_LEVEL=debug
```

## API Endpoints

The new authentication system provides these endpoints:

### Authentication
- `POST /api/auth/github/callback` - Handle GitHub OAuth callback
- `GET /api/auth/user` - Get current user information
- `PUT /api/auth/user/preferences` - Update user preferences
- `POST /api/auth/refresh` - Refresh GitHub token

### Repository Management
- `GET /api/repositories` - Get user's connected repositories
- `GET /api/repositories/available` - Get available repositories from GitHub
- `POST /api/repositories/connect` - Connect a repository
- `DELETE /api/repositories/:id/disconnect` - Disconnect a repository
- `GET /api/repositories/:id/pull-requests` - Get repository pull requests
- `GET /api/repositories/:id/issues` - Get repository issues

## Migration from Personal Access Tokens

If you were previously using personal access tokens:

1. **Remove old environment variables:**
   - `NEXT_PUBLIC_GITHUB_TOKEN`
   - `NEXT_PUBLIC_GITHUB_OWNER`
   - `NEXT_PUBLIC_GITHUB_REPO`

2. **Users will need to:**
   - Sign in with GitHub OAuth
   - Connect their repositories through the UI
   - Their previous data will be preserved

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify all environment variables are set correctly
3. Check browser console and server logs for error messages
4. Ensure your GitHub OAuth app configuration matches your environment

The new OAuth system provides better security and user experience compared to personal access tokens!
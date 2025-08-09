# FreeSwarm PR Manager Backend

A robust Node.js/Express backend for managing GitHub pull requests with real-time updates, caching, and webhook support.

## Features

- 🔄 **Real-time Updates**: WebSocket support for live PR updates
- 📦 **Smart Caching**: Multi-layer caching with SQLite and in-memory storage
- 🔗 **GitHub Integration**: Full GitHub API integration with webhook support
- 🔒 **Security**: Rate limiting, CORS, helmet protection
- 📊 **Performance**: Response compression, efficient data fetching
- 🌐 **Offline Support**: Cached data available when GitHub is unreachable

## Prerequisites

- Node.js 18+ 
- npm or yarn
- GitHub App credentials
- SQLite3

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your GitHub credentials
```

3. Build the TypeScript code:
```bash
npm run build
```

## Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
# Server
PORT=3001
NODE_ENV=development

# GitHub App
GITHUB_APP_ID=your_app_id
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
GITHUB_WEBHOOK_SECRET=your_webhook_secret

# Database
DATABASE_URL=sqlite://./data/database.sqlite

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# CORS
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,https://freeswarm.lol

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Cache
CACHE_TTL_SECONDS=300
```

### GitHub App Setup

1. Create a GitHub App with the following permissions:
   - **Pull Requests**: Read & Write
   - **Repository Metadata**: Read
   - **Issues**: Read
   - **Commit Statuses**: Read

2. Subscribe to webhook events:
   - Pull Request
   - Pull Request Review
   - Issues
   - Push

3. Set webhook URL to: `https://your-domain.com/api/webhooks/github`

## Development

Start the development server with hot reload:

```bash
npm run dev
```

The server will start on `http://localhost:3001`

## API Endpoints

### Pull Requests

- `GET /api/pull-requests` - Get PRs from multiple repositories
  - Query params: `repositories` (comma-separated), `state`, `useCache`
  
- `GET /api/repos/:owner/:repo/pull-requests` - Get PRs for specific repo
  
- `PUT /api/repos/:owner/:repo/pull-requests/:prNumber/status` - Update PR status
  - Body: `{ "action": "close" | "reopen" | "merge" }`
  
- `POST /api/repos/:owner/:repo/pull-requests/:prNumber/comments` - Add comment
  - Body: `{ "comment": "string" }`

### Repositories

- `GET /api/repositories` - Get user repositories

### Issues

- `GET /api/repos/:owner/:repo/issues` - Get repository issues

### Cache

- `GET /api/pull-requests/cached` - Get cached PRs (offline mode)
- `DELETE /api/cache` - Clear all cache
- `GET /api/cache/stats` - Get cache statistics

### Webhooks

- `POST /api/webhooks/github` - GitHub webhook endpoint

### User Preferences

- `GET /api/user/preferences` - Get user preferences
- `PUT /api/user/preferences` - Update user preferences

### Health

- `GET /health` - Health check endpoint

## WebSocket Events

### Client → Server

- `subscribe:repository` - Subscribe to repository updates
- `unsubscribe:repository` - Unsubscribe from repository
- `subscribe:user` - Subscribe to user-specific updates
- `pr:update_status` - Update PR status

### Server → Client

- `pr:updated` - PR has been updated
- `pr:created` - New PR created
- `pr:deleted` - PR deleted
- `webhook:pr` - GitHub PR webhook event
- `webhook:issue` - GitHub issue webhook event
- `system:message` - System notifications

## Database Schema

The backend uses SQLite with the following tables:

- `users` - User accounts and GitHub tokens
- `repositories` - Cached repository data
- `pull_requests` - Cached PR data
- `issues` - Cached issue data
- `cache` - General cache storage
- `user_repositories` - User-repository associations
- `webhook_logs` - Webhook event logs

## Production Deployment

1. Build the project:
```bash
npm run build
```

2. Start production server:
```bash
npm run start:prod
```

3. Use a process manager like PM2:
```bash
pm2 start dist/index.js --name freeswarm-backend
```

4. Set up reverse proxy (nginx example):
```nginx
location /api {
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

## Security Considerations

- Always use HTTPS in production
- Set strong `JWT_SECRET` and `GITHUB_WEBHOOK_SECRET`
- Configure CORS properly for your domain
- Use environment-specific rate limiting
- Regularly rotate access tokens
- Monitor webhook logs for suspicious activity

## Performance Tips

- Enable caching for frequently accessed data
- Use CDN for static assets
- Implement database indexing for large datasets
- Monitor memory usage with cache size
- Use connection pooling for database

## Troubleshooting

### WebSocket Connection Issues
- Check CORS configuration
- Ensure firewall allows WebSocket connections
- Verify nginx/proxy WebSocket support

### GitHub API Rate Limits
- Implement proper caching
- Use conditional requests with ETags
- Consider using GitHub App installation tokens

### Database Lock Errors
- Ensure single database connection
- Implement proper transaction handling
- Use WAL mode for SQLite

## License

ISC

## Support

For issues and questions, please open an issue on GitHub.
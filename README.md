# FreeSwarm - PR Manager

A modern pull request management tool for GitHub that helps you efficiently manage and track pull requests from multiple AI agents and contributors.

## Features

- 🔐 **GitHub OAuth Authentication** - Secure sign-in with your GitHub account
- 📦 **Repository Management** - Connect and manage multiple GitHub repositories
- 🤖 **AI Agent Detection** - Automatically identifies PRs from AI agents (Devin, Cursor, Codex)
- 📊 **Real-time Updates** - Live updates via WebSocket connections
- 🎨 **Modern UI** - Clean, responsive interface built with Next.js and Tailwind CSS
- 🔄 **Auto-refresh** - Configurable automatic data refresh
- 📱 **Mobile Friendly** - Responsive design that works on all devices

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- GitHub account

### 1. Clone the Repository

```bash
git clone <repository-url>
cd freeswarm
```

### 2. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 3. Set Up GitHub OAuth

1. Create a GitHub OAuth App at [GitHub Developer Settings](https://github.com/settings/developers)
2. Set the callback URL to `http://localhost:3000/api/auth/callback/github`
3. Copy your Client ID and Client Secret

### 4. Configure Environment Variables

Create `.env.local` in the root directory:

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

Create `.env` in the `backend` directory:

```env
PORT=3001
NODE_ENV=development
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here
JWT_SECRET=your_jwt_secret_here
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

### 5. Start the Application

```bash
# Start the backend server
cd backend
npm run dev

# In a new terminal, start the frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Usage

1. **Sign In**: Click "Sign in with GitHub" to authenticate with your GitHub account
2. **Connect Repositories**: Use the "Manage Repositories" button to select which repositories to monitor
3. **View PRs**: Browse and manage pull requests from your connected repositories
4. **Track AI Agents**: The system automatically identifies and categorizes PRs from AI agents

## Architecture

- **Frontend**: Next.js 15 with TypeScript, Tailwind CSS, and Radix UI
- **Backend**: Express.js with TypeScript, SQLite database
- **Authentication**: NextAuth.js with GitHub OAuth
- **Real-time**: WebSocket connections for live updates
- **API**: RESTful API with GitHub integration

## Development

### Project Structure

```
├── src/
│   ├── app/                 # Next.js app directory
│   ├── components/          # React components
│   │   ├── auth/           # Authentication components
│   │   ├── repositories/   # Repository management
│   │   └── ui/             # UI components
│   ├── contexts/           # React contexts
│   ├── hooks/              # Custom hooks
│   ├── lib/                # Utility libraries
│   └── types/              # TypeScript types
├── backend/
│   ├── src/
│   │   ├── controllers/    # API controllers
│   │   ├── services/       # Business logic
│   │   └── config/         # Configuration
│   └── data/               # SQLite database
└── docs/                   # Documentation
```

### Available Scripts

```bash
# Frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Backend
cd backend
npm run dev          # Start development server
npm run build        # Build TypeScript
npm run start        # Start production server
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For detailed setup instructions and troubleshooting, see [GITHUB_OAUTH_SETUP.md](GITHUB_OAUTH_SETUP.md).

#!/bin/bash

# FreeSwarm PR Manager - Quick Setup Script
# This script helps you set up both frontend and backend quickly

set -e

echo "🚀 FreeSwarm PR Manager - Quick Setup"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js version
echo "📋 Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+ first.${NC}"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js version 18+ required. Current version: $(node -v)${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node -v) detected${NC}"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
echo "Installing frontend dependencies..."
npm install --silent

echo "Installing backend dependencies..."
cd backend
npm install --silent
cd ..

echo -e "${GREEN}✅ Dependencies installed${NC}"

# Setup environment files
echo ""
echo "🔧 Setting up environment files..."

# Backend .env
if [ ! -f "backend/.env" ]; then
    cp backend/env.example backend/.env
    echo -e "${YELLOW}📝 Created backend/.env - Please edit with your GitHub credentials${NC}"
else
    echo -e "${GREEN}✅ backend/.env already exists${NC}"
fi

# Frontend .env.local
if [ ! -f ".env.local" ]; then
    cp frontend.env.example .env.local
    echo -e "${YELLOW}📝 Created .env.local - Using default settings${NC}"
else
    echo -e "${GREEN}✅ .env.local already exists${NC}"
fi

# Create data directory for backend
mkdir -p backend/data
mkdir -p backend/logs
echo -e "${GREEN}✅ Created data and logs directories${NC}"

# Prompt for GitHub token
echo ""
echo "🔑 GitHub Authentication Setup"
echo "------------------------------"
echo "You need either:"
echo "  1. GitHub Personal Access Token (easier)"
echo "  2. GitHub App credentials (better for production)"
echo ""
read -p "Do you have a GitHub Personal Access Token? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter your GitHub Personal Access Token: " GITHUB_TOKEN
    if [ ! -z "$GITHUB_TOKEN" ]; then
        # Update backend .env with the token
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s/GITHUB_PERSONAL_ACCESS_TOKEN=.*/GITHUB_PERSONAL_ACCESS_TOKEN=$GITHUB_TOKEN/" backend/.env
        else
            # Linux
            sed -i "s/GITHUB_PERSONAL_ACCESS_TOKEN=.*/GITHUB_PERSONAL_ACCESS_TOKEN=$GITHUB_TOKEN/" backend/.env
        fi
        echo -e "${GREEN}✅ GitHub token configured${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Please edit backend/.env and add your GitHub credentials manually${NC}"
    echo ""
    echo "To create a Personal Access Token:"
    echo "1. Go to: https://github.com/settings/tokens"
    echo "2. Generate new token (classic)"
    echo "3. Select scopes: 'repo' and 'read:org'"
    echo "4. Copy token and add to backend/.env"
fi

# Generate JWT secret
echo ""
echo "🔐 Generating JWT secret..."
JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || cat /dev/urandom | head -c 32 | base64)
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" backend/.env
else
    # Linux
    sed -i "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" backend/.env
fi
echo -e "${GREEN}✅ JWT secret generated${NC}"

# Build backend
echo ""
echo "🏗️  Building backend..."
cd backend
npm run build --silent
cd ..
echo -e "${GREEN}✅ Backend built${NC}"

# Summary
echo ""
echo "======================================"
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo "======================================"
echo ""
echo "To start the application:"
echo ""
echo "  Terminal 1 (Backend):"
echo "    cd backend && npm run dev"
echo ""
echo "  Terminal 2 (Frontend):"
echo "    npm run dev"
echo ""
echo "Then open: http://localhost:3000"
echo ""

if [ ! -z "$GITHUB_TOKEN" ]; then
    echo -e "${GREEN}GitHub authentication is configured and ready!${NC}"
else
    echo -e "${YELLOW}⚠️  Don't forget to add your GitHub credentials to backend/.env${NC}"
fi

echo ""
echo "For more information, see SETUP_GUIDE.md"
echo ""

# Ask if user wants to start now
read -p "Would you like to start the application now? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Starting backend and frontend..."
    echo ""
    
    # Start backend in background
    cd backend
    npm run dev &
    BACKEND_PID=$!
    cd ..
    
    # Wait for backend to start
    echo "Waiting for backend to start..."
    sleep 5
    
    # Check if backend is running
    if curl -s http://localhost:3001/health > /dev/null; then
        echo -e "${GREEN}✅ Backend is running${NC}"
    else
        echo -e "${RED}❌ Backend failed to start. Check the logs.${NC}"
        kill $BACKEND_PID 2>/dev/null
        exit 1
    fi
    
    # Start frontend
    echo ""
    echo "Starting frontend..."
    echo -e "${GREEN}Opening http://localhost:3000 in your browser...${NC}"
    echo ""
    echo "Press Ctrl+C to stop both services"
    echo ""
    
    # Open browser (works on macOS and most Linux distros)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        open http://localhost:3000
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        xdg-open http://localhost:3000 2>/dev/null || echo "Please open http://localhost:3000 manually"
    fi
    
    # Start frontend (this will block)
    npm run dev
    
    # Clean up backend when frontend stops
    kill $BACKEND_PID 2>/dev/null
fi

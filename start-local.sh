#!/bin/bash

# 🌾 Farmer Connect - Local Testing Script
# This script helps you test the backend locally before deployment

echo "🚀 Starting Farmer Connect Backend Testing..."
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo "Create .env file with MongoDB connection and API keys"
    echo "Copy from .env.example: cp .env.example .env"
    exit 1
fi

echo -e "${GREEN}✅ .env file found${NC}"
echo ""

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
fi

echo ""
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Start the server
echo -e "${YELLOW}🔧 Starting backend server...${NC}"
echo "Server will run on: http://localhost:5000"
echo ""
echo "📝 To test, open another terminal and run:"
echo "   curl http://localhost:5000/api/health"
echo ""
echo "Press Ctrl+C to stop"
echo ""

npm run dev


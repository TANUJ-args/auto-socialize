#!/bin/bash

# SocialFlow Production Readiness Check
echo "🔍 SocialFlow Production Readiness Check"
echo "========================================"

# Check if required files exist
echo "📋 Checking deployment files..."

files=(
    "docker-compose.yml"
    "Dockerfile"
    "backend/Dockerfile" 
    ".env.example"
    "nginx.conf"
    "DEPLOYMENT.md"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file (missing)"
    fi
done

echo ""
echo "🔧 Checking configuration..."

# Check package.json production scripts
if grep -q '"build:prod"' package.json; then
    echo "✅ Frontend production build script"
else
    echo "❌ Frontend production build script"
fi

if grep -q '"prisma:migrate:prod"' backend/package.json; then
    echo "✅ Backend production migration script"
else
    echo "❌ Backend production migration script"
fi

echo ""
echo "📦 Checking dependencies..."

# Check if node_modules exist
if [ -d "node_modules" ]; then
    echo "✅ Frontend dependencies installed"
else
    echo "⚠️ Frontend dependencies not installed (run: npm install)"
fi

if [ -d "backend/node_modules" ]; then
    echo "✅ Backend dependencies installed"
else
    echo "⚠️ Backend dependencies not installed (run: cd backend && npm install)"
fi

echo ""
echo "🐳 Docker readiness..."

# Check Docker files
if command -v docker &> /dev/null; then
    echo "✅ Docker installed"
    
    if command -v docker-compose &> /dev/null; then
        echo "✅ Docker Compose installed"
    else
        echo "⚠️ Docker Compose not installed"
    fi
else
    echo "⚠️ Docker not installed"
fi

echo ""
echo "📋 Pre-deployment checklist:"
echo "[ ] Copy .env.example to .env and configure"
echo "[ ] Set up PostgreSQL database"
echo "[ ] Configure Instagram Developer App"
echo "[ ] Set up Cloudinary account"
echo "[ ] Configure domain and DNS"
echo "[ ] Set up SSL certificates"
echo ""
echo "🚀 Ready to deploy with: docker-compose up -d"
echo "📖 See DEPLOYMENT.md for detailed instructions"
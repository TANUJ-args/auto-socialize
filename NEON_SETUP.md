# 🗄️ Neon PostgreSQL Setup Commands

## 1. Create Database via Web Console (Easiest)

### Step 1: Sign Up & Create Project
```bash
# Go to: https://console.neon.tech
# 1. Sign up with GitHub/Google (free)
# 2. Click "Create Project"
# 3. Project name: socialflow
# 4. Database name: socialflow
# 5. Region: Choose closest to you
```

### Step 2: Get Connection String
After creating the project, you'll get a connection string like:
```
postgresql://username:password@ep-example-123456.us-east-1.aws.neon.tech/socialflow?sslmode=require
```

## 2. Alternative: Neon CLI Setup

### Install Neon CLI
```powershell
# Install via npm
npm install -g neonctl

# Or via curl (if you have it)
curl -o neonctl.exe https://neon.tech/downloads/neonctl/neonctl-windows.exe
```

### Authenticate & Create Database
```powershell
# Login to Neon
neonctl auth

# Create project
neonctl projects create --name socialflow

# Create database  
neonctl databases create --project-id your-project-id --name socialflow

# Get connection string
neonctl connection-string --project-id your-project-id --database-name socialflow
```

## 3. Test Connection Locally

### Update your .env file
```bash
# In backend/.env, replace the DATABASE_URL with your Neon URL:
DATABASE_URL="postgresql://username:password@ep-example-123456.us-east-1.aws.neon.tech/socialflow?sslmode=require"
```

### Test Connection
```powershell
# Navigate to backend directory
cd backend

# Install dependencies if not already done
npm install

# Generate Prisma client
npx prisma generate

# Run initial migration to create tables
npx prisma migrate dev --name init

# Optional: Open Prisma Studio to view database
npx prisma studio
```

## 4. Quick Connection Verification

### Test Database Connection
```powershell
# Simple connection test
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$connect()
  .then(() => console.log('✅ Database connected successfully!'))
  .catch(err => console.error('❌ Database connection failed:', err))
  .finally(() => prisma.\$disconnect());
"
```

### Check Tables Created
```powershell
# Run this to see if your tables exist
npx prisma db pull
npx prisma generate
```

## 5. Environment Variables for Render

### Copy this connection string format:
```bash
# For Render backend deployment, use this exact format:
DATABASE_URL="postgresql://username:password@host:5432/database?sslmode=require"

# Example (replace with your actual values):
DATABASE_URL="postgresql://myuser:mypassword@ep-cool-lab-123456.us-east-1.aws.neon.tech/socialflow?sslmode=require"
```

## 6. Troubleshooting

### Common Connection Issues
```powershell
# If SSL issues, try these variations:
DATABASE_URL="postgresql://username:password@host:5432/database?sslmode=require"
DATABASE_URL="postgresql://username:password@host:5432/database?sslmode=prefer" 
DATABASE_URL="postgresql://username:password@host:5432/database"

# Test each until one works
```

### Check Neon Dashboard
- Go to https://console.neon.tech
- Select your project → "Dashboard"
- Click "Connection Details" to copy the exact string

## 7. Production Migration (For Render)

### Your backend will automatically run this on deployment:
```bash
npx prisma migrate deploy
```

### Manual migration if needed:
```powershell
# Run locally against production database
DATABASE_URL="your_neon_url" npx prisma migrate deploy
```

---

## 📋 Quick Copy-Paste Checklist

1. ✅ Go to [Neon Console](https://console.neon.tech)
2. ✅ Create project "socialflow" 
3. ✅ Copy connection string
4. ✅ Test locally: `cd backend && npx prisma migrate dev`
5. ✅ Add to Render environment variables
6. ✅ Deploy backend (auto-migrates)

**Your connection string will look like:**
```
postgresql://username:password@ep-example-123456.region.aws.neon.tech/socialflow?sslmode=require
```
# SocialFlow Deployment Guide

## ✅ **No Docker Required!** 
Your SocialFlow app uses standard web technologies and deploys like any modern web application. No containers, no Docker knowledge needed!

## 🚀 Quick Deploy Options

### Option 1: Render + Neon (Recommended - Free Tier Available)

This is the easiest and most cost-effective deployment method using modern cloud services.

#### **Step 1: Setup Neon Database (Free)**
1. Go to [Neon Console](https://console.neon.tech)
2. Create a free account
3. Create a new project
4. Copy the connection string from your dashboard
5. It will look like: `postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb`

#### **Step 2: Deploy Backend on Render**
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Create account and connect your GitHub
3. Click "New" → "Web Service"
4. Connect your repository
5. Configure deployment:
   ```
   Name: socialflow-backend
   Environment: Node
   Build Command: cd backend && npm install && npx prisma generate
   Start Command: cd backend && npx prisma migrate deploy && npm start
   ```
6. Add Environment Variables:
   ```
   NODE_ENV=production
   DATABASE_URL=your_neon_connection_string
   JWT_SECRET=your_secure_32_character_secret
   CLIENT_URL=https://your-frontend-url.onrender.com
   PORT=5000
   
   # Instagram API
   FACEBOOK_APP_ID=your_facebook_app_id
   FACEBOOK_APP_SECRET=your_facebook_app_secret
   INSTAGRAM_REDIRECT_URI=https://your-frontend-url.onrender.com/api/instagram/oauth/callback
   
   # Optional services
   CLOUDINARY_CLOUD_NAME=your_cloudinary_name
   CLOUDINARY_API_KEY=your_cloudinary_key
   CLOUDINARY_API_SECRET=your_cloudinary_secret
   HF_TOKEN=your_huggingface_token
   ```
7. Deploy! Your backend will be at: `https://your-service.onrender.com`

#### **Step 3: Deploy Frontend on Render**
1. In Render Dashboard, click "New" → "Static Site"
2. Connect your repository
3. Configure:
   ```
   Name: socialflow-frontend
   Build Command: npm install && npm run build
   Publish Directory: dist
   ```
4. Add Environment Variables:
   ```
   VITE_API_URL=https://your-backend-service.onrender.com
   ```
5. Deploy! Your frontend will be at: `https://your-frontend.onrender.com`

#### **Step 4: Update Environment Variables**
Go back to your backend service and update:
```
CLIENT_URL=https://your-frontend.onrender.com
INSTAGRAM_REDIRECT_URI=https://your-frontend.onrender.com
```

### Option 2: Vercel + Render + Neon
**Frontend on Vercel (Faster):**
- Connect GitHub repo to Vercel
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `VITE_API_URL=https://your-backend.onrender.com`

**Backend on Render + Neon Database** (same as Option 1)

**Note: No Docker knowledge required for any deployment option!**

### Option 3: Traditional VPS/Server (No Docker Needed)
```bash
# 1. Install Node.js 18+ on your server (PostgreSQL optional - use Neon instead)
# 2. Clone repository
git clone <your-repo-url>
cd ai-social-draft-main

# 3. Setup backend
cd backend
npm install
npx prisma generate
# Create .env file with your Neon database URL
npx prisma migrate deploy
npm run production  # or: NODE_ENV=production npm start

# 4. Setup frontend (new terminal/session)
cd ../
npm install
npm run build
# Serve with simple static server:
npx serve dist -s -l 3000
# Or use nginx/apache to serve the dist/ folder
```

**Note:** Your SocialFlow works perfectly without Docker! It's just a Node.js application.

## � Docker Not Required!

**Your SocialFlow website is 100% independent of Docker!**

✅ **What your website actually is:**
- Frontend: Standard React/Vite application (builds to static HTML/CSS/JS)
- Backend: Standard Node.js/Express API server
- Database: PostgreSQL (works with any PostgreSQL service)

✅ **Docker dependency level: 0%**
- Docker was only provided as a convenience option
- All deployment methods work without Docker
- Your code runs natively on any Node.js environment

✅ **Recommended deployment (No Docker):**
- **Render + Neon:** Deploy with web interface, zero Docker knowledge needed
- **Vercel + Railway:** Same, just connect GitHub repository
- **Traditional VPS:** Just run `npm install` and `npm start`

---

## �🔧 Environment Variables Setup for Render + Neon

### **Backend Environment Variables (Render Web Service):**
```bash
# Production Settings
NODE_ENV=production
PORT=5000

# Database (From Neon Console)
DATABASE_URL=postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb

# Authentication (Generate secure 32+ character string)
JWT_SECRET=your_very_secure_jwt_secret_32_characters_minimum

# CORS (Will be your frontend URL)
CLIENT_URL=https://your-frontend-app.onrender.com

# Instagram API (From Facebook Developers Console)
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
INSTAGRAM_REDIRECT_URI=https://your-frontend-app.onrender.com
```

### **Frontend Environment Variables (Render Static Site):**
```bash
# API Connection (Will be your backend URL)
VITE_API_URL=https://your-backend-app.onrender.com
```

### **Optional Service Variables (Add to Backend):**
```bash
# File Uploads (Cloudinary - Free tier available)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# AI Features (HuggingFace - Free tier available)
HF_TOKEN=your_huggingface_token

# Advanced AI (OpenAI - Paid service)
OPENAI_API_KEY=your_openai_api_key

# Email Notifications (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password

# Billing (Stripe - Optional)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

### **Quick Setup Links:**
- 🗄️ **Neon Database:** [console.neon.tech](https://console.neon.tech) (Free PostgreSQL)
- 🚀 **Render Hosting:** [dashboard.render.com](https://dashboard.render.com) (Free web services)
- 📷 **Cloudinary:** [cloudinary.com](https://cloudinary.com) (Free image/video hosting)
- 🤖 **HuggingFace:** [huggingface.co](https://huggingface.co) (Free AI API)
- 📘 **Instagram API:** [developers.facebook.com](https://developers.facebook.com) (Free)

## 📋 Pre-Deployment Checklist (Render + Neon)

### ✅ **1. Setup Neon Database (5 minutes)**
1. Create account at [Neon Console](https://console.neon.tech)
2. Create new project (free tier: 0.5GB storage, 1 compute unit)
3. Copy connection string from dashboard
4. Save for Render backend environment variables

### ✅ **2. Setup Instagram API (15 minutes)**
1. Create Facebook Developer Account at [developers.facebook.com](https://developers.facebook.com)
2. Create new app with Instagram Basic Display
3. Add Instagram Graph API product
4. Configure OAuth redirect URLs:
   - Development: `http://localhost:8080`
   - Production: `https://your-frontend-app.onrender.com`
5. Get App ID and App Secret
6. Generate long-lived access token

### ✅ **3. Setup Render Account (2 minutes)**
1. Create account at [Render Dashboard](https://dashboard.render.com)
2. Connect your GitHub account
3. Verify email address

### ✅ **4. Optional Services Setup**
**Cloudinary (File Uploads):**
1. Create free account at [cloudinary.com](https://cloudinary.com)
2. Get Cloud Name, API Key, and API Secret from dashboard
3. Free tier: 25GB storage, 25GB bandwidth

**HuggingFace (AI Features):**
1. Create account at [huggingface.co](https://huggingface.co)
2. Go to Settings → Access Tokens
3. Create new token (read permission)
4. Free tier: Limited API calls

### ✅ **5. Deployment Order**
1. **Deploy Backend first** (needs database connection)
2. **Deploy Frontend second** (needs backend URL)
3. **Update environment variables** with final URLs
4. **Test full application** end-to-end

## 🔒 Security Considerations

### Production Security:
- Use strong JWT secrets (32+ characters)
- Enable HTTPS only
- Set secure CORS origins
- Use environment variables for secrets
- Regular security updates
- Database backups
- Rate limiting (already configured)

### Instagram API Security:
- Use production Instagram app
- Secure webhook endpoints
- Validate all incoming requests
- Store tokens securely

## 📊 Monitoring & Maintenance

### Health Checks:
- Backend: `GET /health`
- Database connections
- External API availability
- File upload functionality

### Logging:
- Application logs via console
- Nginx access/error logs
- Database query logs
- API rate limiting logs

### Backups:
```bash
# Database backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# File uploads (if using local storage)
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz uploads/
```

## 🐛 Troubleshooting (Render + Neon)

### **Common Issues & Solutions:**

#### **1. Database Connection Issues**
**Problem:** `Error: P1001: Can't reach database server`
**Solution:**
- Check Neon DATABASE_URL format: `postgresql://username:password@ep-xxx.region.aws.neon.tech/dbname`
- Ensure Neon database is active (auto-sleeps after inactivity)
- Verify connection string has no extra spaces

#### **2. Build Failures on Render**
**Problem:** Build fails during deployment
**Solution:**
- Check build logs in Render dashboard
- Ensure `package.json` has correct scripts
- Verify Node.js version compatibility (use Node 18+)

#### **3. CORS Errors**
**Problem:** Frontend can't connect to backend
**Solution:**
- Update `CLIENT_URL` in backend with exact frontend URL
- Check frontend `VITE_API_URL` points to backend
- Ensure URLs don't have trailing slashes

#### **4. Instagram API Issues**
**Problem:** Instagram OAuth fails
**Solution:**
- Update Instagram app redirect URLs with production domain
- Check `INSTAGRAM_REDIRECT_URI` matches frontend URL exactly
- Verify Facebook app is live (not in development mode)

### **Debug Commands:**

#### **Check Backend Health (Replace with your URLs):**
```bash
# Test backend health endpoint
curl https://your-backend.onrender.com/health

# Test database connection
curl https://your-backend.onrender.com/api/health
```

#### **Check Frontend API Connection:**
```bash
# Open browser developer tools
# Check Network tab for API calls
# Verify requests go to correct backend URL
```

#### **Render Logs:**
- Backend: Go to Render Dashboard → Your Backend Service → Logs
- Frontend: Go to Render Dashboard → Your Frontend Site → Deploys → View Build Logs

### **Performance Notes:**
- **Render Free Tier**: Services sleep after 15 minutes of inactivity
- **Cold Starts**: First request may take 30-60 seconds to wake up
- **Neon**: Database may pause and need reconnection after inactivity

## 🎯 Performance Optimization

### Production Optimizations:
- Enable gzip compression (configured)
- Use CDN for static assets
- Database connection pooling
- Redis cache for sessions
- Image optimization
- Monitoring with error tracking

### Scaling:
- Horizontal scaling with load balancer
- Database read replicas
- Background job processing
- Content Delivery Network (CDN)

## 📞 Support

For deployment issues:
1. Check this guide first
2. Review application logs
3. Verify environment variables
4. Test API endpoints individually

Your SocialFlow application is now ready for production deployment! 🚀
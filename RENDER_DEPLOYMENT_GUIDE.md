# 🚀 Complete Render Deployment Guide (FREE Plan)

## 📋 Prerequisites
- GitHub account with your repository
- 10 minutes of your time
- No payment required!

## 🎯 Step 1: Create Database (2 minutes)

1. Go to [Neon Console](https://console.neon.tech)
2. Sign up for free account
3. Create new project: `socialflow`
4. Copy the PostgreSQL connection string (starts with `postgresql://`)
5. Save it - you'll need it later!

## 🎯 Step 2: Deploy Frontend (3 minutes)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Sign up and connect your GitHub account
3. Click **"New"** → **"Static Site"**
4. Connect your repository: `auto-socialize`
5. Configure:
   ```
   Name: socialflow-frontend
   Root Directory: (leave empty)
   Build Command: npm install && npm run build
   Publish Directory: dist
   ```
6. Add Environment Variables:
   ```
   VITE_API_URL = https://socialflow-backend.onrender.com
   VITE_APP_URL = https://socialflow-frontend.onrender.com
   ```
7. Click **"Create Static Site"**

## 🎯 Step 3: Deploy Backend (3 minutes)

1. In Render Dashboard, click **"New"** → **"Web Service"**
2. Connect same repository: `auto-socialize`
3. Configure:
   ```
   Name: socialflow-backend
   Root Directory: backend
   Environment: Node
   Build Command: npm install && npx prisma generate
   Start Command: npx prisma migrate deploy && npm start
   ```
4. Add Environment Variables (Essential ones first):
   ```
   NODE_ENV = production
   PORT = 10000
   DATABASE_URL = [your_neon_connection_string_from_step_1]
   JWT_SECRET = LEv5DmQSg0L9gz6B2wtFW9HcTmL8VwAtU82r8l9ky5lQm9t41TfhQJm3bBFPuTSO4KX2QegqOJxnTLcRlWjugcoZsTeRu0OaRhwMRYsdyfnxP
   CLIENT_URL = https://socialflow-frontend.onrender.com
   ```
5. Click **"Create Web Service"**

## ✅ Step 4: Verify Deployment (2 minutes)

1. Both services should show **"Live"** status
2. Frontend URL: `https://socialflow-frontend.onrender.com`
3. Backend URL: `https://socialflow-backend.onrender.com`
4. Test frontend - you should see the login page
5. Database tables will be created automatically on first backend start

## 🔧 Optional: Add Features Later

Add these environment variables to backend when you need the features:

### Instagram Integration
```
FACEBOOK_APP_ID = your_facebook_app_id
FACEBOOK_APP_SECRET = your_facebook_app_secret
INSTAGRAM_REDIRECT_URI = https://socialflow-backend.onrender.com/api/instagram/oauth/callback
```

### AI Content Generation
```
OPENAI_API_KEY = your_openai_key
# OR
HF_TOKEN = your_huggingface_token
```

### File Uploads
```
CLOUDINARY_CLOUD_NAME = didphkw9a
CLOUDINARY_API_KEY = 455665947111787
CLOUDINARY_API_SECRET = your_cloudinary_secret
```

### Email Notifications
```
SMTP_HOST = smtp.gmail.com
SMTP_PORT = 587
SMTP_USER = your_email@gmail.com
SMTP_PASS = your_app_password
```

## 🆘 Troubleshooting

### Backend Won't Start
1. Check Render logs for errors
2. Verify `DATABASE_URL` is correctly set
3. Ensure database exists in Neon

### Frontend Can't Connect to Backend
1. Check `VITE_API_URL` points to backend URL
2. Verify both services are "Live"
3. Check CORS settings in backend logs

### Database Migration Errors
- The backend automatically runs migrations on startup
- If issues persist, check Neon database dashboard
- Verify connection string format is correct

## 💡 Tips for Free Plan

1. **Services sleep after 15 minutes of inactivity**
   - First request after sleep takes 30-60 seconds
   - This is normal for free plan

2. **Build times**
   - Frontend: ~2-3 minutes
   - Backend: ~3-5 minutes (includes database migration)

3. **Updating environment variables**
   - Go to service → Environment tab
   - Add/edit variables
   - Service automatically restarts

## 🎉 You're Done!

Your full-stack app is now deployed on Render's free plan:
- ✅ Frontend: React app with Vite
- ✅ Backend: Node.js API with Prisma
- ✅ Database: PostgreSQL on Neon
- ✅ Multi-user architecture ready
- ✅ Instagram OAuth ready (when configured)
- ✅ AI content generation ready (when configured)

Total cost: **$0/month** 🎊
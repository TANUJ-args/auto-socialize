# 🚀 SocialFlow - Render + Neon Deployment Guide

## Quick Deploy to Render + Neon (Free Tier)

### 📋 **What You'll Need (5 minutes setup)**
- GitHub account with your SocialFlow repository
- Neon account (free PostgreSQL database)
- Render account (free web hosting)
- Instagram Business API (Facebook Developers)

---

## 🗄️ **Step 1: Setup Neon Database**

1. **Create Neon Account**
   - Go to [console.neon.tech](https://console.neon.tech)
   - Sign up with GitHub/Google
   
2. **Create Database**
   - Click "Create Project"
   - Choose region (US East recommended)
   - Project name: `socialflow`
   
3. **Get Connection String**
   - Copy the connection string from dashboard
   - Format: `postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb`
   - Save this for later!

**Free Tier:** 0.5 GB storage, auto-pause after inactivity

---

## 🚀 **Step 2: Deploy Backend to Render**

1. **Create Render Account**
   - Go to [dashboard.render.com](https://dashboard.render.com)
   - Sign up and connect GitHub

2. **Create Web Service**
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Select the repository with SocialFlow

3. **Configure Backend Service**
   ```
   Name: socialflow-backend
   Environment: Node
   Root Directory: backend
   Build Command: npm install && npx prisma generate
   Start Command: npx prisma migrate deploy && npm start
   ```

4. **Add Environment Variables**
   ```bash
   NODE_ENV=production
   PORT=5000
   DATABASE_URL=your_neon_connection_string_here
   JWT_SECRET=create_a_secure_32_character_secret_key_here
   CLIENT_URL=https://socialflow-frontend.onrender.com
   
   # Instagram API (get from Facebook Developers)
   FACEBOOK_APP_ID=your_facebook_app_id
   FACEBOOK_APP_SECRET=your_facebook_app_secret
   INSTAGRAM_REDIRECT_URI=https://socialflow-frontend.onrender.com
   ```

5. **Deploy Backend**
   - Click "Create Web Service"
   - Wait for build to complete (~3-5 minutes)
   - Note your backend URL: `https://socialflow-backend.onrender.com`

---

## 🌐 **Step 3: Deploy Frontend to Render**

1. **Create Static Site**
   - In Render Dashboard, click "New" → "Static Site"
   - Select same GitHub repository

2. **Configure Frontend**
   ```
   Name: socialflow-frontend
   Build Command: npm install && npm run build
   Publish Directory: dist
   ```

3. **Add Environment Variable**
   ```bash
   VITE_API_URL=https://socialflow-backend.onrender.com
   ```

4. **Deploy Frontend**
   - Click "Create Static Site"
   - Wait for build (~2-3 minutes)
   - Your app URL: `https://socialflow-frontend.onrender.com`

---

## 🔄 **Step 4: Update Backend URLs**

1. **Go back to Backend Service**
   - Update environment variables with final frontend URL:
   ```bash
   CLIENT_URL=https://your-actual-frontend-url.onrender.com
   INSTAGRAM_REDIRECT_URI=https://your-actual-frontend-url.onrender.com
   ```

2. **Redeploy Backend**
   - Click "Manual Deploy" to apply new settings

---

## 📘 **Step 5: Setup Instagram API**

1. **Facebook Developers Console**
   - Go to [developers.facebook.com](https://developers.facebook.com)
   - Create new app → "Business" type
   
2. **Add Instagram Products**
   - Add "Instagram Basic Display"
   - Add "Instagram Graph API"
   
3. **Configure OAuth**
   - Valid OAuth Redirect URIs:
     - `https://your-frontend-url.onrender.com`
   
4. **Get Credentials**
   - Copy App ID and App Secret
   - Update Render backend environment variables
   - Redeploy backend

---

## ✅ **Step 6: Test Your Deployment**

### **Health Checks:**
- Backend: `https://your-backend.onrender.com/health`
- Frontend: `https://your-frontend.onrender.com`

### **Test Features:**
1. Open frontend URL
2. Create account / sign in
3. Connect Instagram account
4. Create a test post
5. Verify everything works!

---

## 💰 **Cost Breakdown (Free Tier)**

| Service | Free Tier | Limits |
|---------|-----------|---------|
| **Neon Database** | Free | 0.5 GB storage, auto-pause |
| **Render Backend** | Free | 750 hours/month, sleeps after 15min |
| **Render Frontend** | Free | 100 GB bandwidth/month |
| **Cloudinary** | Free | 25 GB storage, 25 GB bandwidth |
| **HuggingFace AI** | Free | Rate-limited API calls |

**Total: $0/month** for moderate usage!

---

## 🔧 **Optional: Add File Uploads (Cloudinary)**

1. **Create Cloudinary Account**
   - Go to [cloudinary.com](https://cloudinary.com)
   - Sign up for free account

2. **Get Credentials**
   - Dashboard → Account Details
   - Copy: Cloud Name, API Key, API Secret

3. **Add to Backend Environment**
   ```bash
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

4. **Redeploy Backend**

---

## 🚨 **Important Notes**

### **Free Tier Limitations:**
- Services sleep after 15 minutes of inactivity
- First request after sleep takes 30-60 seconds (cold start)
- Database auto-pauses, may need reconnection

### **Production Considerations:**
- Upgrade to paid plans for always-on services
- Use custom domains for professional URLs
- Add monitoring and alerts
- Setup automated backups

---

## 🎉 **Congratulations!**

Your SocialFlow is now live at:
- **Frontend:** `https://your-frontend.onrender.com`
- **Backend:** `https://your-backend.onrender.com`

**Features Available:**
✅ User authentication  
✅ Instagram account connection  
✅ Post creation and scheduling  
✅ AI-powered content generation  
✅ File uploads (with Cloudinary)  
✅ Responsive design  

**Start managing Instagram content with AI! 🚀📱**
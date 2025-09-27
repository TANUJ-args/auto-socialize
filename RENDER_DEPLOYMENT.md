# 🚀 Quick Render Deployment Guide for SocialFlow

## 🎯 **Deploy in 3 Steps (15 minutes total)**

### **Step 1: Setup Database (3 minutes)**
1. Go to [Neon Console](https://console.neon.tech) → Sign up (free)
2. Create new project → Name it "socialflow"
3. **Copy your connection string** (looks like):
   ```
   postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb
   ```
4. **Save this URL** - you'll need it in Step 2!

---

### **Step 2: Deploy Backend on Render (5 minutes)**

#### **A. Create Render Account**
1. Go to [Render Dashboard](https://dashboard.render.com) → Sign up
2. Connect your GitHub account
3. Click **"New"** → **"Web Service"**
4. Select your `ai-social-draft-main` repository

#### **B. Configure Backend Service**
```yaml
Name: socialflow-backend
Environment: Node
Build Command: npm install && npx prisma generate
Start Command: npx prisma migrate deploy && npm start
```

#### **C. Add Environment Variables (Click "Advanced" → "Add Environment Variable")**
**REQUIRED (Minimum to work):**
```bash
NODE_ENV=production
DATABASE_URL=your_neon_connection_string_from_step_1
JWT_SECRET=your_super_secure_32_character_random_string_here
CLIENT_URL=https://socialflow-frontend.onrender.com
PORT=5000
```

**OPTIONAL (Add Instagram later):**
```bash
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret  
INSTAGRAM_REDIRECT_URI=https://socialflow-frontend.onrender.com
```

5. Click **"Create Web Service"** → Wait 3-5 minutes for deployment
6. **Copy your backend URL** (e.g., `https://socialflow-backend.onrender.com`)

---

### **Step 3: Deploy Frontend on Render (5 minutes)**

#### **A. Create Frontend Service**
1. In Render Dashboard → **"New"** → **"Static Site"**
2. Select same repository
3. Configure:

```yaml
Name: socialflow-frontend
Build Command: npm install && npm run build
Publish Directory: dist
```

#### **B. Add Environment Variable**
```bash
VITE_API_URL=https://socialflow-backend.onrender.com
```
*(Use YOUR actual backend URL from Step 2)*

4. Click **"Create Static Site"** → Wait 2-3 minutes
5. **Your app is live!** 🎉

---

### **Step 4: Final Configuration (2 minutes)**
Go back to your **backend service** → **Environment** → Update:
```bash
CLIENT_URL=https://your-actual-frontend-url.onrender.com
```
*(Use your actual frontend URL)*

**Redeploy backend** → Your app is fully configured! ✅

---

## 🔑 **Environment Variables Reference**

### **Backend (Web Service)**
```bash
# Essential (App won't work without these)
NODE_ENV=production
DATABASE_URL=postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb
JWT_SECRET=generate_32_character_random_string
CLIENT_URL=https://your-frontend.onrender.com
PORT=5000

# Instagram (Optional - add when ready)
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret
INSTAGRAM_REDIRECT_URI=https://your-frontend.onrender.com

# AI Features (Optional - enhances content generation)  
GEMINI_API_KEY=your_gemini_key
HF_TOKEN=your_huggingface_token

# File Storage (Optional - uses local storage otherwise)
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
```

### **Frontend (Static Site)**
```bash
VITE_API_URL=https://your-backend.onrender.com
```

---

## 🚀 **Your Live URLs**
- **Backend API:** `https://socialflow-backend.onrender.com`
- **Frontend App:** `https://socialflow-frontend.onrender.com`
- **Database:** Your Neon PostgreSQL instance

---

## 🔧 **Generate JWT Secret**
Need a secure JWT secret? Use this command:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🆘 **Quick Troubleshooting**

### **Backend won't start:**
- ✅ Check `DATABASE_URL` is correct
- ✅ Verify `JWT_SECRET` is set (32+ characters)
- ✅ Ensure all required variables are set

### **Frontend can't connect:**
- ✅ Verify `VITE_API_URL` matches your backend URL exactly
- ✅ Check backend `CLIENT_URL` matches your frontend URL
- ✅ Both services should be deployed successfully

### **Database errors:**
- ✅ Confirm Neon database is active
- ✅ Check connection string format
- ✅ Ensure database allows connections

---

## 🎉 **Success! Your App Features**

Once deployed, your SocialFlow app includes:
- ✅ **User Authentication** - Sign up/login with JWT
- ✅ **Dashboard** - Modern UI with dark/light themes
- ✅ **Post Management** - Create, edit, schedule posts
- ✅ **Instagram Integration** - Connect Instagram accounts (when configured)
- ✅ **AI Content Generation** - Smart post creation (when API keys added)
- ✅ **Responsive Design** - Works on mobile, tablet, desktop

---

## 📈 **Add Features Later**

### **Instagram Integration:**
1. Create Facebook App → Get App ID & Secret
2. Add Instagram variables to backend
3. Redeploy → Instagram login works!

### **AI Content:**
1. Get Gemini API key from Google AI Studio
2. Add `GEMINI_API_KEY` to backend
3. Redeploy → AI writing assistant enabled!

### **File Uploads:**
1. Create Cloudinary account (free tier)
2. Add Cloudinary variables
3. Redeploy → Image/video uploads work!

---

**🎯 Total Time: ~15 minutes for a fully working social media management app!**

**Need help?** Check the main deployment docs or troubleshooting guides in your project.
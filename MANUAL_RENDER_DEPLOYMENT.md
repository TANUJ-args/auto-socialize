# 🚀 Manual Render Deployment - Step by Step

## ⚠️ Blueprint Not Working? Use Manual Setup!

If the YAML blueprint is giving errors, here's the manual deployment process:

---

## 📋 **Step 1: Create Backend Web Service**

### **Go to Render Dashboard:**
1. Visit [dashboard.render.com](https://dashboard.render.com)
2. Click **"New"** → **"Web Service"**
3. Connect your GitHub repository: `TANUJ-args/auto-socialize`

### **Configure Backend Service:**
```yaml
Name: socialflow-backend
Environment: Node
Root Directory: backend
Build Command: npm install && npx prisma generate
Start Command: npx prisma migrate deploy && npm start
Instance Type: Free
```

### **Add Environment Variables:**
Click **"Advanced"** → **"Add Environment Variable"**

**🔴 REQUIRED (App won't work without these):**
```bash
NODE_ENV=production
DATABASE_URL=your_neon_postgresql_connection_string
JWT_SECRET=your_32_character_random_secret
CLIENT_URL=https://socialflow-frontend.onrender.com
PORT=5000
```

**🟡 OPTIONAL (Instagram features):**
```bash
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
INSTAGRAM_REDIRECT_URI=https://socialflow-frontend.onrender.com
```

**🟢 OPTIONAL (AI features):**
```bash
GEMINI_API_KEY=your_gemini_api_key
HF_TOKEN=your_huggingface_token
```

**🔵 OPTIONAL (File storage):**
```bash
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
```

### **Deploy Backend:**
- Click **"Create Web Service"**
- Wait 3-5 minutes for deployment
- **Copy your backend URL** (e.g., `https://socialflow-backend-xxx.onrender.com`)

---

## 🌐 **Step 2: Create Frontend Static Site**

### **Create Static Site:**
1. In Render Dashboard → **"New"** → **"Static Site"**
2. Select same repository: `TANUJ-args/auto-socialize`

### **Configure Frontend:**
```yaml
Name: socialflow-frontend
Build Command: npm install && npm run build
Publish Directory: dist
```

### **Add Environment Variable:**
```bash
VITE_API_URL=https://your-actual-backend-url.onrender.com
```
*(Replace with YOUR actual backend URL from Step 1)*

### **Deploy Frontend:**
- Click **"Create Static Site"**
- Wait 2-3 minutes for deployment
- **Copy your frontend URL** (e.g., `https://socialflow-frontend-xxx.onrender.com`)

---

## 🔄 **Step 3: Connect Services**

### **Update Backend Configuration:**
1. Go to your **backend service** → **"Environment"** tab
2. Update `CLIENT_URL` variable:
   ```bash
   CLIENT_URL=https://your-actual-frontend-url.onrender.com
   ```
3. Click **"Save Changes"** → Service will redeploy automatically

---

## 🎯 **Step 4: Generate Required Secrets**

### **Generate JWT Secret:**
Run this in any terminal or online tool:
```javascript
// 32-character random string
Math.random().toString(36).substring(2, 15) + 
Math.random().toString(36).substring(2, 15) + 
Math.random().toString(36).substring(2, 5)

// Or use Node.js:
require('crypto').randomBytes(32).toString('hex')
```

### **Get Database URL:**
1. Go to [console.neon.tech](https://console.neon.tech)
2. Sign up (free)
3. Create project: "socialflow"
4. Copy connection string from dashboard

---

## ✅ **Step 5: Test Deployment**

### **Backend Health Check:**
Visit: `https://your-backend-url.onrender.com/api/health`
Should return: `{"status":"ok","timestamp":"..."}`

### **Frontend Check:**
Visit: `https://your-frontend-url.onrender.com`
Should load the SocialFlow login page

### **Full App Test:**
1. Try creating an account
2. Test login functionality
3. Check if dashboard loads

---

## 🆘 **Common Issues & Solutions**

### **❌ Backend won't start:**
- **Check DATABASE_URL** - Must be valid PostgreSQL connection
- **Check JWT_SECRET** - Must be 32+ characters
- **Check logs** - Look for error messages in Render dashboard

### **❌ Frontend can't connect:**
- **Verify VITE_API_URL** - Must match exact backend URL
- **Check CORS** - Backend CLIENT_URL must match frontend URL
- **Check build logs** - Look for build errors

### **❌ Database connection fails:**
- **Verify Neon database is active**
- **Check connection string format**
- **Ensure database allows connections**

### **❌ "Module not found" errors:**
- **Clear build cache** - Redeploy both services
- **Check package.json** - Ensure all dependencies listed
- **Verify build commands** - Should match exactly

---

## 🎯 **Success Checklist**

Your deployment is successful when:
- [ ] Backend shows **"Live"** status in dashboard
- [ ] Frontend shows **"Live"** status in dashboard  
- [ ] Health check returns 200 OK
- [ ] Frontend loads without console errors
- [ ] User registration works
- [ ] Login redirects to dashboard

---

## 📊 **Your Live URLs**

After successful deployment:
- **Frontend:** `https://socialflow-frontend-xxx.onrender.com`
- **Backend API:** `https://socialflow-backend-xxx.onrender.com`
- **Health Check:** `https://socialflow-backend-xxx.onrender.com/api/health`

---

## 🚀 **Next Steps**

### **Add Instagram Integration:**
1. Create Facebook App for Instagram API
2. Add Instagram environment variables to backend
3. Test Instagram OAuth flow

### **Enable AI Features:**
1. Get Gemini API key from Google AI Studio
2. Add `GEMINI_API_KEY` to backend
3. Test AI content generation

### **Set up File Uploads:**
1. Create Cloudinary account (free tier)
2. Add Cloudinary credentials to backend
3. Test image/video uploads

**🎉 Your SocialFlow app is now live and ready for users!**
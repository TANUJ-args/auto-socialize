# 🚀 SocialFlow Deployment Environment Variables Guide

## 📋 **Quick Reference for Deployment**

### **ESSENTIAL Variables (Required for Basic Functionality)**
Your app won't work without these 4 core variables:

```bash
# Database Connection (REQUIRED)
DATABASE_URL="postgresql://username:password@host:port/database"

# Security & Authentication (REQUIRED)  
JWT_SECRET="your-secure-32-character-secret"

# Server Configuration (REQUIRED)
PORT=5000
CLIENT_URL="https://your-frontend-domain.com"
NODE_ENV="production"
```

---

## 🎯 **Feature-Specific Variables**

### **Instagram Integration (Required for Instagram features)**
```bash
FACEBOOK_APP_ID="your-facebook-app-id"
FACEBOOK_APP_SECRET="your-facebook-app-secret"  
INSTAGRAM_REDIRECT_URI="https://your-frontend-domain.com"
```

### **AI Content Generation (Optional - Enhanced Features)**
```bash
# Google Gemini AI
GEMINI_API_KEY="your-gemini-api-key"

# Hugging Face AI Models  
HF_TOKEN="your-huggingface-token"

# OpenAI (if using)
OPENAI_API_KEY="your-openai-api-key"
```

### **File Upload & Media Storage (Optional)**
```bash
# Cloudinary for image/video hosting
CLOUDINARY_CLOUD_NAME="your-cloudinary-name"
CLOUDINARY_API_KEY="your-cloudinary-key"  
CLOUDINARY_API_SECRET="your-cloudinary-secret"
```

### **Email Notifications (Optional)**
```bash
# SMTP Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

---

## 🔥 **Deployment Strategies**

### **Minimal Deployment (Just Get It Running!)**
Only need these 4 variables to start:
```bash
DATABASE_URL="your-postgres-connection-string"
JWT_SECRET="generate-32-character-secret"  
CLIENT_URL="https://your-frontend-url.com"
NODE_ENV="production"
```

### **Full Feature Deployment**
All variables for complete functionality:
```bash
# Core
DATABASE_URL="postgresql://username:password@host:port/database"
JWT_SECRET="your-secure-32-character-secret"
PORT=5000
CLIENT_URL="https://your-frontend-domain.com"
NODE_ENV="production"

# Instagram
FACEBOOK_APP_ID="your-facebook-app-id"
FACEBOOK_APP_SECRET="your-facebook-app-secret"
INSTAGRAM_REDIRECT_URI="https://your-frontend-domain.com"

# AI Services
GEMINI_API_KEY="your-gemini-api-key"
HF_TOKEN="your-huggingface-token"

# Media Storage
CLOUDINARY_CLOUD_NAME="your-cloudinary-name"
CLOUDINARY_API_KEY="your-cloudinary-key"
CLOUDINARY_API_SECRET="your-cloudinary-secret"

# Email
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

---

## 🏭 **Platform-Specific Setup**

### **Render.com (Recommended)**
```bash
# Backend Web Service Environment Variables:
NODE_ENV=production
DATABASE_URL=your_neon_postgres_url
JWT_SECRET=your_32_char_secret
CLIENT_URL=https://your-frontend.onrender.com
PORT=5000

# Add Instagram/AI variables as needed
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret
```

### **Vercel (Frontend) + Render (Backend)**
```bash
# Vercel Environment Variables:
VITE_API_URL=https://your-backend.onrender.com

# Render Backend: (same as above)
```

### **Railway/Heroku Style**
```bash
# All variables in one place
DATABASE_URL=postgresql://...
JWT_SECRET=your_secret
CLIENT_URL=https://your-app.railway.app
# ... add other variables
```

---

## 🔐 **Security Notes**

### **⚠️ NEVER Commit These to Git:**
- `INSTAGRAM_ACCESS_TOKEN` (regenerate if exposed)
- `JWT_SECRET`
- `FACEBOOK_APP_SECRET` 
- `CLOUDINARY_API_SECRET`
- `GEMINI_API_KEY`
- `HF_TOKEN`
- `SMTP_PASS`

### **✅ Safe to Share:**
- `FACEBOOK_APP_ID`
- `CLOUDINARY_CLOUD_NAME`  
- `CLOUDINARY_API_KEY`
- `PORT`
- `CLIENT_URL`

---

## 🚀 **Quick Deployment Checklist**

### **Phase 1: Get It Running**
- [ ] Set up PostgreSQL database (Neon.tech recommended)
- [ ] Generate secure JWT_SECRET (32+ characters)
- [ ] Deploy with 4 essential variables
- [ ] Test basic app functionality

### **Phase 2: Add Instagram**
- [ ] Create Facebook App for Instagram API
- [ ] Add Instagram OAuth variables
- [ ] Test Instagram login flow

### **Phase 3: Enable AI Features**  
- [ ] Get Gemini API key from Google AI Studio
- [ ] Add HF_TOKEN for Hugging Face models
- [ ] Test AI content generation

### **Phase 4: Add File Storage**
- [ ] Set up Cloudinary account
- [ ] Add Cloudinary variables  
- [ ] Test image/video uploads

### **Phase 5: Email Notifications**
- [ ] Configure SMTP (Gmail App Password recommended)
- [ ] Add email variables
- [ ] Test email sending

---

## 🆘 **Troubleshooting**

### **App Won't Start:**
- Check DATABASE_URL connection
- Verify JWT_SECRET is set
- Ensure PORT is available

### **Instagram Not Working:**
- Verify Facebook App setup
- Check INSTAGRAM_REDIRECT_URI matches exactly
- Ensure app is in production mode on Facebook

### **AI Features Disabled:**
- Confirm API keys are valid
- Check quota limits on AI services
- Verify environment variables are loaded

### **Files Not Uploading:**
- Check Cloudinary configuration
- Verify API keys and secrets
- Test with small file first

---

## 📚 **Related Documentation**

- [Full Deployment Guide](./DEPLOYMENT.md)
- [Instagram API Setup](./INSTAGRAM_API_SETUP.md)
- [Production Features](./PRODUCTION_FEATURES.md)
- [Cloudinary Setup](./CLOUDINARY_SETUP.md)

---

## 🎯 **Your Website Status: ✅ READY FOR DEPLOYMENT!**

Your SocialFlow application is production-ready and can be deployed with minimal configuration. Start with the 4 essential variables and add features incrementally!

**Last Updated:** September 27, 2025
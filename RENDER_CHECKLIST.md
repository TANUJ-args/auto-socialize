# 🎯 Render Deployment Checklist

## Pre-Deployment Setup ✅

- [ ] **GitHub Repository Ready**
  - Code is pushed to GitHub
  - `.env` files are in `.gitignore` 
  - No sensitive data committed

- [ ] **Database Setup**
  - [ ] Sign up for [Neon](https://console.neon.tech) (free)
  - [ ] Create new project: "socialflow"
  - [ ] Copy connection string
  - [ ] Test connection (optional)

- [ ] **Generate JWT Secret**
  ```bash
  # Run this to generate secure secret:
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

## Backend Deployment (Render Web Service) 🔧

- [ ] **Create Service**
  - [ ] Go to [Render Dashboard](https://dashboard.render.com)
  - [ ] Connect GitHub account
  - [ ] New → Web Service
  - [ ] Select `ai-social-draft-main` repo

- [ ] **Configure Service**
  - [ ] Name: `socialflow-backend`
  - [ ] Environment: `Node`  
  - [ ] Build Command: `npm install && npx prisma generate`
  - [ ] Start Command: `npx prisma migrate deploy && npm start`

- [ ] **Add Environment Variables**
  ```bash
  NODE_ENV=production
  DATABASE_URL=your_neon_connection_string
  JWT_SECRET=your_generated_32_char_secret  
  CLIENT_URL=https://socialflow-frontend.onrender.com
  PORT=5000
  ```

- [ ] **Deploy Backend**
  - [ ] Click "Create Web Service"
  - [ ] Wait for deployment (3-5 minutes)
  - [ ] Copy backend URL (e.g., `https://socialflow-backend.onrender.com`)
  - [ ] Test: Visit `your-backend-url/api/health` (should return OK)

## Frontend Deployment (Render Static Site) 🌐

- [ ] **Create Static Site**
  - [ ] In Render Dashboard → New → Static Site
  - [ ] Select same repository
  - [ ] Name: `socialflow-frontend`

- [ ] **Configure Static Site**
  - [ ] Build Command: `npm install && npm run build`
  - [ ] Publish Directory: `dist`

- [ ] **Add Environment Variable**
  ```bash
  VITE_API_URL=https://your-actual-backend-url.onrender.com
  ```
  *(Replace with YOUR backend URL from previous step)*

- [ ] **Deploy Frontend**
  - [ ] Click "Create Static Site" 
  - [ ] Wait for deployment (2-3 minutes)
  - [ ] Copy frontend URL (e.g., `https://socialflow-frontend.onrender.com`)

## Final Configuration 🔄

- [ ] **Update Backend CORS**
  - [ ] Go to backend service → Environment tab
  - [ ] Update `CLIENT_URL` to your actual frontend URL
  - [ ] Click "Save Changes" → Service will redeploy

- [ ] **Test Full Application**
  - [ ] Visit your frontend URL
  - [ ] Try signing up for new account
  - [ ] Test login functionality
  - [ ] Check dashboard loads
  - [ ] Verify API connections work

## Optional Features (Add Later) ⭐

### Instagram Integration
- [ ] **Facebook Developer Account**
  - [ ] Create app at [Facebook Developers](https://developers.facebook.com)
  - [ ] Get App ID and App Secret
  - [ ] Configure Instagram Basic Display

- [ ] **Add Instagram Variables**
  ```bash
  FACEBOOK_APP_ID=your_app_id
  FACEBOOK_APP_SECRET=your_app_secret
  INSTAGRAM_REDIRECT_URI=https://your-frontend-url.onrender.com
  ```

### AI Content Generation  
- [ ] **Google AI Studio**
  - [ ] Get API key from [Google AI Studio](https://aistudio.google.com)
  - [ ] Add `GEMINI_API_KEY=your_key`

- [ ] **Hugging Face (Optional)**
  - [ ] Sign up at [Hugging Face](https://huggingface.co)  
  - [ ] Get token and add `HF_TOKEN=your_token`

### File Uploads
- [ ] **Cloudinary Setup**
  - [ ] Sign up at [Cloudinary](https://cloudinary.com)
  - [ ] Get credentials from dashboard
  - [ ] Add all three Cloudinary variables

## Troubleshooting 🔍

### Backend Issues
- [ ] Check logs in Render dashboard
- [ ] Verify all environment variables are set
- [ ] Test database connection string
- [ ] Ensure JWT_SECRET is 32+ characters

### Frontend Issues  
- [ ] Check build logs for errors
- [ ] Verify `VITE_API_URL` is correct
- [ ] Test API endpoint directly in browser
- [ ] Check browser console for errors

### Database Issues
- [ ] Verify Neon database is active
- [ ] Check connection string format
- [ ] Test with database client tool
- [ ] Ensure migrations ran successfully

## 🎉 Success Metrics

Your deployment is successful when:
- ✅ Backend returns 200 at `/api/health`
- ✅ Frontend loads without console errors  
- ✅ User registration works
- ✅ Login redirects to dashboard
- ✅ Dashboard shows user interface

## 📊 Monitoring

- **Backend Logs:** Render Dashboard → Your Service → Logs
- **Frontend Logs:** Render Dashboard → Your Static Site → Deploys
- **Database:** Neon Console → Your Project → Monitoring
- **Uptime:** Both services should show "Live" status

---

**🎯 Estimated Total Time: 15-20 minutes for basic deployment**

**Need Help?** 
- Check `RENDER_DEPLOYMENT.md` for detailed steps
- Review `DEPLOYMENT_ENVIRONMENT_VARIABLES.md` for variable reference
- Visit Render documentation for platform-specific issues
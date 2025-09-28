# 🚀 SocialFlow - AI-Powered Social Media Management

> **Transform your social media strategy with intelligent automation and seamless content creation.**

## ⚡ Quick Deploy (FREE - 10 minutes)

📖 **[Complete Step-by-Step Guide](./RENDER_DEPLOYMENT_GUIDE.md)**

### 🎯 Three Simple Steps:
1. **Database**: [Create free Neon PostgreSQL](https://console.neon.tech) → Copy connection string
2. **Frontend**: [Deploy Static Site on Render](https://dashboard.render.com) → Connect repo → Set build commands  
3. **Backend**: [Deploy Web Service on Render](https://dashboard.render.com) → Set environment variables

**Result**: Full-stack app running on `https://your-app.onrender.com` - **$0/month** 🎉

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/TANUJ-args/auto-socialize)

## ✨ **Features**

### 🤖 **AI-Powered Content Creation**
- **Smart Post Generation** - AI creates engaging content tailored to your audience
- **Multi-Platform Optimization** - Content adapted for different social platforms
- **Trend Analysis** - AI suggests trending topics and hashtags

### 📱 **Instagram Integration** 
- **Seamless OAuth** - Connect Instagram accounts securely
- **Auto-Posting** - Schedule and publish posts automatically
- **Media Management** - Upload and organize photos/videos
- **Stories & Reels** - Support for all Instagram content types

### 📊 **Content Management**
- **Drag & Drop Scheduling** - Intuitive calendar interface  
- **Bulk Operations** - Manage multiple posts efficiently
- **Content Library** - Organize and reuse your best content
- **Performance Analytics** - Track engagement and reach

### 🎨 **Modern Interface**
- **Dark/Light Themes** - Customizable user experience
- **Responsive Design** - Works perfectly on all devices
- **Real-time Updates** - Instant sync across all your devices
- **Intuitive Dashboard** - Clean, professional interface

---

## 🚀 **Quick Start**

### **Option 1: One-Click Deploy (Recommended)**
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/TANUJ-args/auto-socialize)

1. Click the deploy button above
2. Set up your [Neon Database](https://console.neon.tech) (free)
3. Add your database URL and JWT secret
4. Your app will be live in ~10 minutes! 🎉

### **Option 2: Local Development**
```bash
# Clone the repository
git clone https://github.com/TANUJ-args/auto-socialize.git
cd auto-socialize

# Install dependencies
npm install
cd backend && npm install && cd ..

# Set up environment variables
cp backend/.env.example backend/.env
# Edit backend/.env with your credentials

# Start development servers
npm run dev        # Frontend (localhost:5173)
cd backend && npm run dev  # Backend (localhost:5000)
```

---

## 📋 **Environment Variables**

### **Required (Minimum Setup)**
```bash
DATABASE_URL=postgresql://username:password@host:port/database
JWT_SECRET=your_32_character_random_secret
CLIENT_URL=https://your-frontend-url.com
NODE_ENV=production
```

### **Optional Features**
```bash
# Instagram Integration
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

# AI Content Generation  
GEMINI_API_KEY=your_gemini_api_key
HF_TOKEN=your_huggingface_token

# File Storage
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
```

---

## 🏗️ **Tech Stack**

### **Frontend**
- ⚛️ **React 18** - Modern UI framework
- 🎨 **Tailwind CSS** - Utility-first styling
- 🔧 **Vite** - Lightning-fast build tool
- 📱 **Responsive Design** - Mobile-first approach

### **Backend**  
- 🟢 **Node.js** - JavaScript runtime
- 🚀 **Express** - Web framework
- 🗄️ **Prisma** - Modern database toolkit
- 🔐 **JWT** - Secure authentication

### **Database**
- 🐘 **PostgreSQL** - Reliable, scalable database
- ☁️ **Neon** - Serverless PostgreSQL (recommended)

### **Deployment**
- 🌐 **Render** - Full-stack hosting platform
- 🔄 **GitHub Actions** - CI/CD pipeline
- 📦 **Docker** - Containerization (optional)

---

## 📖 **Documentation**

### **📚 Setup Guides**
- [📋 Environment Variables](./DEPLOYMENT_ENVIRONMENT_VARIABLES.md)
- [🚀 Render Deployment](./RENDER_DEPLOYMENT.md) 
- [✅ Manual Deployment](./MANUAL_RENDER_DEPLOYMENT.md)
- [📱 Instagram API Setup](./INSTAGRAM_API_SETUP.md)
- [☁️ Cloudinary Setup](./CLOUDINARY_SETUP.md)

### **🎯 Features**
- [✨ Production Features](./PRODUCTION_FEATURES.md)
- [📊 Analytics & Billing](./backend/src/routes/analytics.js)
- [🤖 AI Content Generation](./backend/src/routes/chat.js)
- [📅 Post Scheduling](./backend/src/services/publisher.js)

---

## 🎯 **Project Status**

### **✅ Completed Features**
- 🔐 **User Authentication** - JWT-based secure login
- 📱 **Instagram OAuth** - Connect Instagram accounts  
- 🤖 **AI Content Generation** - Smart post creation
- 📊 **Post Management** - Create, edit, schedule posts
- 🎨 **Modern UI/UX** - Responsive dashboard
- ☁️ **File Uploads** - Cloudinary integration
- 📈 **Analytics** - Performance tracking
- 🚀 **Production Ready** - Full deployment setup

### **🔄 In Development**
- 📱 Instagram Stories automation
- 🎬 Video content optimization
- 📊 Advanced analytics dashboard
- 🤝 Team collaboration features

---

## 🌟 **Screenshots**

### **Dashboard**
![Dashboard](https://via.placeholder.com/800x400?text=SocialFlow+Dashboard)

### **Content Creation**
![Content Creation](https://via.placeholder.com/800x400?text=AI+Content+Generation)

### **Instagram Integration**
![Instagram](https://via.placeholder.com/800x400?text=Instagram+Management)

---

## 🤝 **Contributing**

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### **Development Setup**
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm test`
5. Commit: `git commit -m 'Add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Open a Pull Request

---

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## 🆘 **Support**

### **📞 Need Help?**
- 📖 **Documentation** - Check our comprehensive guides
- 🐛 **Issues** - [Open an issue](https://github.com/TANUJ-args/auto-socialize/issues)
- 💬 **Discussions** - [Join our community](https://github.com/TANUJ-args/auto-socialize/discussions)

### **🚀 Deployment Support**
- [Render Deployment Guide](./RENDER_DEPLOYMENT.md)
- [Manual Setup Instructions](./MANUAL_RENDER_DEPLOYMENT.md)
- [Troubleshooting Guide](./GIT_CLEANUP_GUIDE.md)

---

## 🎉 **Quick Links**

- 🌐 **[Live Demo](https://socialflow-frontend.onrender.com)** - See it in action
- 📖 **[Documentation](./DEPLOYMENT_ENVIRONMENT_VARIABLES.md)** - Complete setup guide
- 🚀 **[Deploy Now](https://render.com/deploy?repo=https://github.com/TANUJ-args/auto-socialize)** - One-click deployment
- 💼 **[Portfolio](https://github.com/TANUJ-args)** - More projects by the author

---

**Built with ❤️ by [TANUJ](https://github.com/TANUJ-args)**

*Transform your social media presence with intelligent automation.* ✨
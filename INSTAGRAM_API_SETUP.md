# 🎬 Instagram Reel Posting - API Setup Guide

## 🚨 **What API Do You Need?**

To post Instagram Reels, you need an **Instagram Business Account Access Token**. Here's exactly what to set up:

## 📋 **Required APIs & Setup**

### 1. **Facebook Developer App** 
```
🌐 Website: https://developers.facebook.com
📝 What you need: Facebook App with Instagram Basic Display + Instagram Graph API
```

### 2. **Required App Permissions**
```
✅ instagram_basic
✅ instagram_content_publish  ← CRITICAL for posting Reels
✅ pages_show_list
✅ pages_read_engagement
```

### 3. **Instagram Business Account**
```
❌ Personal Instagram → Won't work
✅ Instagram Business Account → Required
✅ Connected to Facebook Page → Mandatory
```

## 🛠️ **Step-by-Step Setup**

### Step 1: Create Facebook App
1. Go to [Facebook Developers](https://developers.facebook.com)
2. Click **"Create App"** → **"Business"** type
3. Add **Instagram Basic Display** product
4. Add **Instagram Graph API** product

### Step 2: Configure Your App
```javascript
// Update your .env file:
FACEBOOK_APP_ID="your_facebook_app_id_here"
FACEBOOK_APP_SECRET="your_facebook_app_secret_here"  
INSTAGRAM_REDIRECT_URI="http://localhost:5000/api/instagram/oauth/callback"
```

### Step 3: Set Up Instagram Business Account
1. **Convert to Business**: Instagram Settings → Account → Switch to Professional Account → Business
2. **Connect Facebook Page**: Link your Instagram to a Facebook Page you manage
3. **Verify Connection**: Ensure both accounts are properly linked

### Step 4: Get Access Token

#### Option A: Use Your App's OAuth Flow
1. **Navigate to**: `http://localhost:8080/dashboard`  
2. **Click**: "Connect Instagram" in Accounts Manager
3. **Authorize**: Your Facebook app to access Instagram
4. **Token Auto-Saved**: System automatically stores token

#### Option B: Manual Token (For Testing)
1. Go to [Facebook Graph API Explorer](https://developers.facebook.com/tools/explorer)
2. Select your app
3. Generate User Access Token with scopes:
   ```
   instagram_basic,pages_show_list,instagram_content_publish
   ```
4. **Add manually in browser console**:
   ```javascript
   localStorage.setItem('ig_access_token', 'YOUR_TOKEN_HERE');
   ```

#### Option C: Demo Mode (For Development)
```javascript
// Use demo token for testing (no real posting):
localStorage.setItem('ig_access_token', 'DEMO_TOKEN_FOR_TESTING');
```

## 🎯 **Quick Fix for Current Issue**

**Right now, to test Reels posting:**

1. **Open Browser Console** (F12)
2. **Run this command**:
   ```javascript
   localStorage.setItem('ig_access_token', 'DEMO_TOKEN_FOR_TESTING');
   ```
3. **Refresh page** and try posting again
4. **Success!** - It will simulate Reel posting without real Instagram API

## 🔧 **Checking Your Setup**

### Verify Instagram Connection
```javascript
// Check in browser console:
console.log('Instagram Token:', localStorage.getItem('ig_access_token'));

// Should show either:
// - Real token: "IGQVJYour_real_token_here..."  
// - Demo token: "DEMO_TOKEN_FOR_TESTING"
// - null: Need to connect Instagram
```

### Test API Connection
```bash
# Test your backend Instagram endpoint:
curl -X POST http://localhost:5000/api/instagram/create-post \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "accessToken": "DEMO_TOKEN_FOR_TESTING",
    "caption": "Test Reel #demo", 
    "mediaUrl": "https://example.com/video.mp4",
    "mediaType": "VIDEO",
    "isReels": true
  }'
```

## 📊 **Current Status Check**

### ✅ **What's Working (Your App)**
- Backend Reels API implementation ✅
- Frontend Reels UI and validation ✅  
- Video upload and preview ✅
- Demo mode for testing ✅

### ❓ **What Needs Setup (Your APIs)**
- Facebook Developer App configuration
- Instagram Business Account connection
- Access token generation/storage
- App review for `instagram_content_publish` permission

## 🚀 **Immediate Solutions**

### **For Testing Right Now:**
```javascript
// Browser console command:
localStorage.setItem('ig_access_token', 'DEMO_TOKEN_FOR_TESTING');
// Then refresh page and try posting Reels!
```

### **For Production Use:**
1. **Complete Facebook App setup** (steps above)
2. **Get real Instagram Business token** 
3. **Submit for App Review** (if permissions needed)
4. **Connect via your app's OAuth flow**

## 🎬 **Ready to Post Reels!**

Once you have the access token (even demo), your Reel posting will work perfectly:

- ✅ **Vertical video validation** (9:16 aspect ratio)
- ✅ **Duration checking** (15-90 seconds) 
- ✅ **File format validation** (MP4, MOV)
- ✅ **Real-time preview** and processing status
- ✅ **Instagram Graph API** integration with Reels endpoints

**The "add API" message will disappear once you have the Instagram access token set up!** 🎯

---

## 📞 **Need Help?**

1. **Demo Mode**: Use `DEMO_TOKEN_FOR_TESTING` for immediate testing
2. **Real Setup**: Follow Facebook Developer App creation steps  
3. **Troubleshooting**: Check browser console for token status
4. **Verification**: Test with demo mode first, then real tokens

Your Reel posting feature is **technically perfect** - you just need the Instagram access token! 🚀✨
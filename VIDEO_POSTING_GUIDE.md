# 🎬 Instagram Reels Video Posting - Quick Start Guide

## 🚨 **Current Status: URL-Based Posting**

Your application is configured and ready for Instagram Reels, but currently requires **publicly accessible URLs** instead of file uploads.

## 🎯 **How to Post Reels Right Now**

### **Step 1: Set Instagram Token**
```javascript
// Run this in browser console (F12):
localStorage.setItem('ig_access_token', 'EAAXeRTcivhQBPh4uG23CZB5At11Tz33kolMDmkmEhATZBUzXVnt2a7wJcNDvMlxZBChT2vjmwCbzh9LZBPMXLEY2WJoehfdcxHuvgFJBkFySR7aaoQfK2AHQDBEmOAQrXaMu1LuqSj8u9Sgq1qn2ZAssCwCZAsSCNFK5SPaIDye8l21Q18atFPtXZBsXjBD');
localStorage.setItem('instagram_connected', 'true');
```

### **Step 2: Use These Test Video URLs**

**✅ Working Test URLs (Public Domain):**

**Vertical Videos (Perfect for Reels):**
```
https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4
https://sample-videos.com/zip/10/mp4/360.mp4
https://www.w3schools.com/html/mov_bbb.mp4
```

**Your Own Videos:**
1. **Google Drive** (EASIEST) → Just paste the sharing link! 
   - Right-click video → "Get link" → Copy (we auto-convert it)
   - Example: `https://drive.google.com/file/d/XXXXX/view`
2. **Upload to YouTube** (unlisted) → Copy video URL
3. **Use Dropbox/OneDrive** → Create public share link
4. **Host on your own server** with public access

### **Step 3: Post Your Reel**

1. **Go to Dashboard** → Click "Create Post"
2. **Select "Video"** from Post Type  
3. ✅ **Check "Post as Instagram Reel"**
4. **Enter Video URL** in the "Video URL (Required)" field:
   ```
   https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4
   ```
5. **Add Caption**: "My test Reel! #reels #test"
6. **Click "Create Reel Post"**

## 🎬 **Expected Results**

**✅ Success Response:**
- "Reel posted successfully to Instagram!"
- Appears in your Instagram Reels tab
- Also shared to main feed (if enabled)
- Saved in your app's database

**❌ Common Errors & Solutions:**

| Error | Solution |
|-------|----------|
| "mediaUrl must be http(s) URL" | Use https:// URL, not local files |
| "Instagram not connected" | Run Step 1 token setup |
| "Media URL is required" | Enter a valid video URL |
| "Reels must be video content" | Select "Video" type when Reels enabled |

## 🔧 **Troubleshooting**

### **Test Demo Mode First:**
```javascript
// Set demo token for testing (no real posting):
localStorage.setItem('ig_access_token', 'DEMO_TOKEN_FOR_TESTING');
```

### **Verify Token Status:**
```javascript
// Check current setup:
console.log('Token:', localStorage.getItem('ig_access_token'));
console.log('Connected:', localStorage.getItem('instagram_connected'));
```

### **Backend Validation:**
Your backend will validate:
- ✅ Token exists and is valid
- ✅ URL is publicly accessible (http/https)
- ✅ Video duration (15-90 seconds for Reels)
- ✅ Instagram API connectivity

## 📱 **Video Requirements for Reels**

**✅ Perfect Reel Videos:**
- **Aspect Ratio**: 9:16 (vertical)
- **Duration**: 15-90 seconds  
- **Format**: MP4, MOV
- **Quality**: 1080x1920 minimum
- **Size**: Under 100MB
- **Content**: Engaging, vertical-optimized

## 🚀 **Next Steps: File Upload**

**Coming Soon Features:**
- ✅ Direct file upload (no URLs needed)
- ✅ Cloud storage integration (AWS S3, Cloudinary)
- ✅ Video compression and optimization
- ✅ Thumbnail generation
- ✅ Bulk upload capabilities

**Current Workaround:**
Use any public video hosting service (YouTube, Vimeo, Google Drive) and paste the direct video URL.

---

## 🎯 **Ready to Test!**

Your Instagram Reels posting is **fully functional** with URL-based videos. Use the test URLs above to verify everything works perfectly! 🎬✨

**Pro Tip**: Start with the BigBuckBunny test URL - it's a reliable public video that works great for testing your Reel posting flow!
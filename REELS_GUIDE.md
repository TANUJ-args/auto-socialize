# 🎬 Instagram Reels Posting Guide

## Overview
Your application now supports posting Instagram Reels through the Instagram Graph API. Reels are vertical videos that appear in Instagram's dedicated Reels feed and can also be shared to the main feed.

## 🎯 Reel Requirements

### Video Specifications
- **Format**: MP4 or MOV files only
- **Duration**: 15-90 seconds (recommended: 15-30 seconds for best engagement)
- **Aspect Ratio**: 9:16 (vertical/portrait orientation)
- **Resolution**: Minimum 1080x1920 pixels
- **File Size**: Maximum 100MB
- **Frame Rate**: 23-60 FPS

### Content Guidelines
- **Vertical videos** perform best on Reels
- **Square (1:1) videos** also work but may have black bars
- **Horizontal videos** are not recommended for Reels

## 🚀 How to Post Reels

### Method 1: Dedicated Instagram Create Page
1. Navigate to `/instagram/create` 
2. Select "Video Post" media type
3. ✅ **Check "Post as Instagram Reel"** checkbox
4. Upload your vertical video file (9:16 aspect ratio recommended)
5. Add your caption with relevant hashtags
6. Click "Create Reel Post"

### Method 2: Main Dashboard Modal
1. Go to Dashboard → Click "Create Post"
2. Select "Video" from Post Type dropdown
3. ✅ **Check "Post as Instagram Reel"** option
4. Upload your video file or enter video URL
5. Preview your video 
6. Select Instagram as platform
7. Click "Create Reel Post"

## 🎨 UI Features

### Visual Indicators
- **Pink/Purple styling** when Reels mode is enabled
- **Reel requirements card** showing vertical video specs
- **"🎬 Post as Instagram Reel"** checkbox with clear labeling
- **Dynamic button text** showing "Create Reel Post" vs "Create Video Post"

### Validation
- **Automatic format checking** (MP4/MOV only)
- **Duration validation** (15-90 seconds for Reels)
- **File size limits** (100MB maximum)
- **Real-time preview** of uploaded videos

## 🔧 Technical Implementation

### API Parameters
When posting a Reel, the system sends:
```javascript
{
  "mediaUrl": "https://example.com/video.mp4",
  "mediaType": "VIDEO", 
  "isReels": true,
  "caption": "Your reel caption with #hashtags"
}
```

### Instagram Graph API
- Uses `media_type: 'REELS'` parameter
- Automatically sets `share_to_feed: true` 
- Posts to both Reels tab and main feed
- Supports video processing status checks

### Processing Flow
1. **Upload & Validate** → Video file/URL validation
2. **Create Container** → Instagram media container with Reels type  
3. **Process Video** → Instagram processes the video (up to 30 seconds)
4. **Publish Reel** → Final publication to Instagram
5. **Database Save** → Store post record in your database

## 📊 Best Practices

### Content Creation
- **Vertical orientation** (9:16) performs best
- **15-30 seconds** optimal length for engagement  
- **Clear audio** and good lighting
- **Trending music/sounds** can boost reach
- **Engaging thumbnails** for better click rates

### Captions & Hashtags
- **Hook viewers** in first 3 seconds
- **Include relevant hashtags** (#reels #trending)
- **Call-to-action** to encourage engagement
- **Keep captions concise** but engaging

### Technical Tips
- **Test with shorter videos** first (15-20 seconds)
- **Use high-quality source files** for best results
- **Preview before posting** to check quality
- **Monitor processing status** for large files

## 🔍 Troubleshooting

### Common Issues

**"Video must be between 15-90 seconds"**
- Check your video duration
- Trim video if too long
- Ensure minimum 15 seconds for Reels

**"Video file must be under 100MB"**
- Compress your video file
- Use video editing tools to reduce file size
- Consider lower resolution if necessary

**"Please select a video file"**
- Ensure you're uploading MP4 or MOV format
- Check file isn't corrupted
- Try a different video file

**Processing timeout**
- Large video files may take longer to process
- Wait up to 30 seconds for completion
- Retry if processing fails

### Demo Mode
For testing without real Instagram tokens:
- Use `DEMO_TOKEN_FOR_TESTING` as access token
- All Reel features work in demo mode
- No actual posting to Instagram occurs

## 🎯 Success Metrics

### What Happens After Posting
- ✅ **Immediate confirmation** with success message
- 🎬 **Appears in Instagram Reels tab** 
- 📱 **Also shows in main feed** (if share_to_feed enabled)
- 📊 **Saved to your dashboard** for tracking
- 🔄 **Can be edited/deleted** from your interface

### Engagement Features
- **Comments and likes** tracked through Instagram
- **Analytics available** via Instagram Insights
- **Resharing capabilities** for viewers
- **Algorithm boost** for Reels content

---

## 🚀 Ready to Create Reels!

Your Instagram Reels posting feature is now fully functional. The interface provides clear guidance, validation, and processing status updates to ensure successful Reel creation every time!

**Pro Tip**: Start with short, vertical videos (15-30 seconds) for best results and engagement! 🎬✨
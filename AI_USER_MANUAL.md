# AI Assistant User Manual 🤖

## 🎯 **Image Generation Prompts** (Will generate NEW images)

```
✅ "generate image of a sunset over Tokyo skyline"
✅ "create image of a cat wearing sunglasses"
✅ "make picture of a futuristic sports car"
✅ "draw image of Naruto eating ramen in a cozy restaurant"
✅ "generate photo of a minimalist coffee shop interior"
```

## 📝 **Post Creation Prompts** (Will use EXISTING images)

```
✅ "create an Instagram post using that image"
✅ "write a caption for this image"
✅ "make a social media post with that picture"
✅ "create content using the image above"
✅ "write an Instagram post about this photo"
✅ "generate a caption and hashtags for that image"
```

## 💬 **Content Assistance Prompts** (Regular AI chat)

```
✅ "write a caption about coffee culture"
✅ "give me 10 hashtags for fitness posts"
✅ "create a LinkedIn post about productivity"
✅ "help me write about travel experiences"
✅ "suggest content ideas for a food blog"
```

## 🔄 **Complete Workflow Examples:**

### **Example 1: Anime Content**
```
1. "generate image of Luffy from One Piece eating at a street food stall"
2. [Wait for image to appear]
3. "create an Instagram post using that image"
```

### **Example 2: Lifestyle Content**
```
1. "create image of a cozy reading nook with books and coffee"
2. [Wait for image to appear]  
3. "write a caption for this image about self-care and relaxation"
```

### **Example 3: Business Content**
```
1. "generate picture of a modern office workspace"
2. [Wait for image to appear]
3. "create a LinkedIn post using that image about productivity"
```

## 🎨 **Advanced Image Prompts:**

```
✅ "generate image of a cyberpunk city at night with neon lights"
✅ "create picture of a peaceful zen garden with cherry blossoms"
✅ "make image of a vintage record store with vinyl collections"
✅ "draw picture of a space astronaut floating near Earth"
✅ "generate photo of a bustling Indian street market"
```

## 📱 **Social Media Specific Prompts:**

```
✅ "create Instagram story content using that image"
✅ "write a Twitter thread about this picture"
✅ "make a TikTok description for that video concept"
✅ "generate LinkedIn carousel post content"
✅ "create Facebook post with that image"
```

## 🚫 **What NOT to Say** (These might confuse the AI):

```
❌ "create image using that picture" (confusing - create vs use)
❌ "make new post with old image" (mixed signals)
❌ "generate content image post" (unclear intent)
```

## 🎯 **Pro Tips:**

1. **Be Specific**: "Generate image of X" vs "Create post using that image"
2. **Use Clear Keywords**: 
   - For NEW images: "generate", "create image", "make picture"
   - For EXISTING images: "using that image", "with this picture", "from that photo"
3. **Wait for Images**: Let the image fully load before asking for posts
4. **Reference Context**: Use "that image", "this picture", "the photo above"

## 🧪 **Test Sequence:**

Try this exact sequence to test everything:

```
1. "generate image of a golden retriever playing in a park"
2. [Wait for image]
3. "create an Instagram post using that image"
4. [Should get caption, NOT new image]
5. "give me 5 more hashtags for this post"
6. [Should get hashtags for the dog image]
```

## 🚀 **Understanding AI Behavior:**

The AI Assistant will perfectly understand whether you want:
- 🎨 **New images** (when you say generate/create image)
- 📝 **Content for existing images** (when you reference "that image")
- 💬 **General assistance** (regular questions)

## 📋 **Quick Reference:**

| Intent | Keywords | Example |
|--------|----------|---------|
| Generate Image | "generate image", "create image", "make picture" | "generate image of a dragon" |
| Use Existing Image | "using that image", "with this image", "from that photo" | "create post using that image" |
| Get Help | Regular questions | "write about productivity" |

## 🔧 **Technical Details:**

- **Image Generation**: Powered by Hugging Face FLUX models
- **Storage**: PostgreSQL database with persistent chat history
- **Context**: AI remembers previous images in the conversation
- **Formats**: Images automatically converted to base64 for web display

---

**Happy creating! 🎉**
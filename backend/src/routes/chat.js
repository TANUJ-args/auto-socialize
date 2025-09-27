import express from 'express';
import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import { InferenceClient } from '@huggingface/inference';
import { authenticate } from '../middleware/auth.js';
import { checkUsageLimit, trackUsage } from '../services/billing.js';

const router = express.Router();
const prisma = new PrismaClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// Get or create active session
router.get('/session', authenticate, async (req, res) => {
  try {
    let session = await prisma.chatSession.findFirst({
      where: {
        userId: req.userId,
        isActive: true
      },
      include: {
        messages: {
          orderBy: { timestamp: 'asc' }
        }
      }
    });
    
    if (!session) {
      session = await prisma.chatSession.create({
        data: {
          userId: req.userId,
          title: 'New Chat Session',
          isActive: true
        },
        include: {
          messages: true
        }
      });
    }
    
    res.json({ session });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({ error: 'Failed to get chat session' });
  }
});

// Send message and get AI response
router.post('/message', authenticate, async (req, res) => {
  try {
    const { message, sessionId, replyingTo } = req.body;
    
    if (!message || !sessionId) {
      return res.status(400).json({ error: 'Message and sessionId required' });
    }
    
    // Save user message
    const userMessage = await prisma.chatMessage.create({
      data: {
        sessionId,
        userId: req.userId,
        role: 'user',
        content: message
      }
    });
    
    // Get session context with image metadata
    const previousMessages = await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { timestamp: 'asc' },
      take: 15  // Increased to get more context
    });
    
    // Generate AI response with context
    let systemContent = "You are a social media content assistant that helps create engaging Instagram, Twitter, and LinkedIn content. \n\nIMPORTANT CONTEXT RULES:\n- When users say 'that image', 'this image', 'the image you generated', or 'using the image', they are referring to images marked with '[Generated image:]' in the conversation history\n- DO NOT generate new images when they ask to use existing ones\n- Help them create captions, posts, hashtags, and content for existing images\n- You can see generated images in the chat history marked as '[Generated image: prompt]'\n- Focus on creating compelling social media content using those existing images\n- For NEW image requests (like 'generate image of...'), let them know they should use the image generation feature";
    
    // Add reply context if user is replying to a specific message
    if (replyingTo) {
      systemContent += ` The user is replying to this previous message: "${replyingTo.content}"`;
      if (replyingTo.imageUrl) {
        systemContent += ` (which included an image)`;
      }
      systemContent += `. Consider this context when responding and reference what they're replying to appropriately.`;
    }

    // Check for recent image generations to add to system context
    const recentImages = previousMessages.filter(msg => {
      if (msg.role === 'assistant' && msg.metadata) {
        try {
          const metadata = typeof msg.metadata === 'string' ? JSON.parse(msg.metadata) : msg.metadata;
          return metadata.type === 'image';
        } catch (e) {
          return false;
        }
      }
      return false;
    }).slice(-3); // Last 3 images
    
    if (recentImages.length > 0) {
      systemContent += "\n\nRECENT IMAGES IN THIS CONVERSATION:";
      recentImages.forEach((img, index) => {
        try {
          const metadata = typeof img.metadata === 'string' ? JSON.parse(img.metadata) : img.metadata;
          systemContent += `\n${index + 1}. Generated image with prompt: "${img.content.replace('Generated image: ', '')}"`;
        } catch (e) {
          // Ignore
        }
      });
      systemContent += "\n\nWhen users reference 'that image' or similar, they likely mean one of these recent images.";
    }

    // Build messages with image context
    const messages = [
      {
        role: "system",
        content: systemContent
      },
      ...previousMessages.map(msg => {
        let content = msg.content;
        
        // Add image context to AI messages that generated images
        if (msg.role === 'assistant' && msg.metadata) {
          try {
            const metadata = typeof msg.metadata === 'string' ? JSON.parse(msg.metadata) : msg.metadata;
            if (metadata.imageUrl) {
              content = `[GENERATED IMAGE] ${content}`;
            }
          } catch (e) {
            // Ignore JSON parse errors
          }
        }
        
        return {
          role: msg.role,
          content: content
        };
      }),
      {
        role: "user",
        content: message
      }
    ];
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
      temperature: 0.7,
      max_tokens: 2048,
    });
    
    const aiResponse = completion.choices[0].message.content;
    
    // Save AI response
    const assistantMessage = await prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'assistant',
        content: aiResponse
      }
    });
    
    // Track usage for billing
    await trackUsage(req.userId, 'chatMessages', 1);
    
    res.json({ 
      userMessage, 
      assistantMessage 
    });
  } catch (error) {
    console.error('Chat message error:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

// Generate image using Hugging Face Inference Client
router.post('/generate-image', authenticate, async (req, res) => {
  try {
    const { prompt, model = 'black-forest-labs/FLUX.1-schnell', sessionId } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt required' });
    }

    // Check usage limits
    const usageCheck = await checkUsageLimit(req.userId, 'images');
    if (!usageCheck.allowed) {
      return res.status(429).json({ 
        error: 'Image generation limit reached', 
        limit: usageCheck.limit,
        used: usageCheck.used,
        message: 'Upgrade your plan to generate more images this month'
      });
    }

    // Available models for Hugging Face Inference
    const availableModels = {
      'black-forest-labs/FLUX.1-schnell': 'FLUX.1 Schnell (Fast)',
      'black-forest-labs/FLUX.1-dev': 'FLUX.1 Dev (High Quality)',
      'stabilityai/stable-diffusion-3-5-large': 'Stable Diffusion 3.5 Large',
      'stabilityai/stable-diffusion-xl-base-1.0': 'Stable Diffusion XL',
      'runwayml/stable-diffusion-v1-5': 'Stable Diffusion v1.5'
    };

    // Validate model
    if (!availableModels[model]) {
      return res.status(400).json({ 
        error: 'Invalid model', 
        availableModels: Object.keys(availableModels) 
      });
    }

    // Check if HF_TOKEN is configured
    if (!process.env.HF_TOKEN) {
      console.error('❌ HF_TOKEN not found in environment variables');
      return res.status(500).json({ 
        error: 'Hugging Face token not configured. Please add HF_TOKEN to environment variables.',
        details: 'Get a free token at https://huggingface.co/settings/tokens'
      });
    }

    console.log(`🎨 Generating image with model: ${model}`);
    console.log(`📝 Prompt: ${prompt}`);
    console.log(`🔑 Token: ${process.env.HF_TOKEN.substring(0, 8)}...${process.env.HF_TOKEN.substring(process.env.HF_TOKEN.length - 4)}`);

    // Initialize Hugging Face client
    const client = new InferenceClient(process.env.HF_TOKEN);

    // Generate image using Hugging Face Inference client
    let imageBlob;
    try {
      console.log('🚀 Starting image generation...');
      
      // Use textToImage with the client
      imageBlob = await client.textToImage({
        provider: "auto",
        model: model,
        inputs: prompt,
        parameters: { 
          num_inference_steps: model.includes('schnell') ? 5 : 20
        }
      });
      
      console.log('✅ Image generation completed');
      
    } catch (modelError) {
      console.log(`⚠️ Primary model failed, trying alternative: ${modelError.message}`);
      // Try with a different model if the primary one fails
      if (model === 'black-forest-labs/FLUX.1-schnell') {
        const alternativeModel = 'black-forest-labs/FLUX.1-dev';
        console.log(`🔄 Trying alternative model: ${alternativeModel}`);
        
        imageBlob = await client.textToImage({
          provider: "auto",
          model: alternativeModel,
          inputs: prompt,
          parameters: { num_inference_steps: 20 }
        });
      } else if (model === 'black-forest-labs/FLUX.1-dev') {
        const alternativeModel = 'runwayml/stable-diffusion-v1-5';
        console.log(`🔄 Trying alternative model: ${alternativeModel}`);
        
        imageBlob = await client.textToImage({
          model: alternativeModel,
          inputs: prompt
        });
      } else {
        throw modelError;
      }
    }

    // Validate blob
    if (!imageBlob || imageBlob.size === 0) {
      throw new Error('Generated image is empty or invalid');
    }

    console.log(`Generated image blob size: ${imageBlob.size} bytes`);

    // Convert blob to base64
    const buffer = await imageBlob.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    
    if (!base64 || base64.length === 0) {
      throw new Error('Failed to convert image to base64');
    }

    const imageUrl = `data:image/png;base64,${base64}`;
    
    console.log('Image generation successful');

    // Save to chat history if sessionId provided
    let userMessage = null;
    let assistantMessage = null;
    
    if (sessionId) {
      // Get or create session
      let session = await prisma.chatSession.findFirst({
        where: { 
          id: sessionId,
          userId: req.userId 
        }
      });

      if (!session) {
        session = await prisma.chatSession.create({
          data: {
            userId: req.userId,
            isActive: true
          }
        });
      }

      // Save user message (image request)
      userMessage = await prisma.chatMessage.create({
        data: {
          sessionId: session.id,
          role: 'user',
          content: prompt
        }
      });

      // Save assistant message (generated image)
      assistantMessage = await prisma.chatMessage.create({
        data: {
          sessionId: session.id,
          role: 'assistant',
          content: `Generated image: ${prompt}`,
          metadata: JSON.stringify({
            type: 'image',
            imageUrl: imageUrl,
            model: model,
            modelName: availableModels[model],
            size: imageBlob.size
          })
        }
      });
    }
    
    // Track usage for billing
    await trackUsage(req.userId, 'imagesGenerated', 1);
    
    res.json({ 
      imageUrl, 
      model,
      modelName: availableModels[model],
      prompt,
      size: imageBlob.size,
      userMessage,
      assistantMessage
    });
  } catch (error) {
    console.error('Generate image error:', error);
    res.status(500).json({ 
      error: 'Failed to generate image', 
      details: error.message 
    });
  }
});

// Get available image generation models
router.get('/image-models', authenticate, async (req, res) => {
  try {
    const models = {
      'runwayml/stable-diffusion-v1-5': {
        name: 'Stable Diffusion v1.5',
        description: 'Most reliable and popular model - best for realistic images',
        recommended: true,
        status: '✅ Active'
      },
      'prompthero/openjourney': {
        name: 'OpenJourney',
        description: 'Midjourney-style artistic generation - great for creative art',
        recommended: true,
        status: '✅ Active'
      },
      'CompVis/stable-diffusion-v1-4': {
        name: 'Stable Diffusion v1.4',
        description: 'Original Stable Diffusion - good for experimentation',
        recommended: false,
        status: '✅ Active'
      },
      'dreamlike-art/dreamlike-diffusion-1.0': {
        name: 'Dreamlike Diffusion',
        description: 'Artistic style with dreamlike, surreal quality',
        recommended: false,
        status: '✅ Active'
      }
    };
    
    res.json({ models });
  } catch (error) {
    console.error('Get models error:', error);
    res.status(500).json({ error: 'Failed to get available models' });
  }
});

// Test Hugging Face API connection
router.get('/test-hf-connection', authenticate, async (req, res) => {
  try {
    console.log('🧪 Testing HF connection...');
    
    if (!process.env.HF_TOKEN) {
      console.log('❌ No HF_TOKEN found in environment');
      return res.status(500).json({ 
        error: 'HF_TOKEN not configured',
        solution: 'Add your Hugging Face token to the .env file',
        tokenValid: false,
        modelAvailable: false
      });
    }

    const token = process.env.HF_TOKEN;
    console.log(`Token length: ${token.length}`);
    console.log(`Token starts with: ${token.substring(0, 8)}...`);

    // Test with a simple API call
    const testResponse = await fetch(
      'https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5',
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log(`HF API Response Status: ${testResponse.status}`);
    
    const responseText = await testResponse.text();
    console.log(`HF API Response: ${responseText.substring(0, 200)}...`);

    const tokenValid = testResponse.status !== 401;
    const modelAvailable = testResponse.status !== 404;
    
    let detailedMessage = '';
    if (testResponse.status === 401) {
      detailedMessage = 'Invalid or expired Hugging Face token';
    } else if (testResponse.status === 404) {
      detailedMessage = 'Model not found or not accessible';
    } else if (testResponse.status === 503) {
      detailedMessage = 'Model is loading, please wait and try again';
    } else if (testResponse.status === 200) {
      detailedMessage = 'Connection successful - ready to generate images!';
    } else {
      detailedMessage = `Unexpected status: ${testResponse.status}`;
    }

    res.json({
      tokenValid,
      modelAvailable,
      status: testResponse.status,
      message: tokenValid && modelAvailable ? 'Connection successful' : 'Connection issues detected',
      detailedMessage,
      tokenLength: token.length,
      responsePreview: responseText.substring(0, 100)
    });

  } catch (error) {
    console.error('HF connection test failed:', error);
    res.status(500).json({ 
      error: 'Connection test failed',
      details: error.message,
      tokenValid: false,
      modelAvailable: false
    });
  }
});

// Save AI message as draft post
router.post('/save-as-draft', authenticate, async (req, res) => {
  try {
    const { content, platform = 'instagram' } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Content required' });
    }
    
    const post = await prisma.post.create({
      data: {
        userId: req.userId,
        content,
        postType: 'text',
        status: 'draft',
        platforms: [platform],
        aiGenerated: true
      }
    });
    
    res.json({ post });
  } catch (error) {
    console.error('Save draft error:', error);
    res.status(500).json({ error: 'Failed to save as draft' });
  }
});

// Analyze image and generate caption
router.post('/analyze-image', authenticate, async (req, res) => {
  try {
    const { imageUrl, prompt } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL required' });
    }

    const analysisPrompt = prompt || 'Create an engaging Instagram caption for this image. Include relevant hashtags and emojis. Keep it concise but engaging.';

    // Check if we need to convert base64 to public URL (similar to create-post logic)
    let processedImageUrl = imageUrl;
    if (imageUrl.startsWith('data:image/')) {
      // For base64 images, we'll use a text-based approach since GPT-4V might not accept data URLs
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a social media expert who creates engaging Instagram captions. The user has an AI-generated image and needs a compelling Instagram caption."
          },
          {
            role: "user",
            content: `Create an engaging Instagram caption for an AI-generated image. ${analysisPrompt} 

Make it creative, engaging, and include relevant hashtags. Since this is an AI-generated image, you can be creative about the content but keep it general and appealing for social media.`
          }
        ],
        max_tokens: 300,
        temperature: 0.8
      });
      
      const caption = completion.choices[0].message.content;
      return res.json({ caption, imageUrl });
    }

    // For regular HTTP URLs, try to use GPT-4 Vision
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a social media expert who creates engaging Instagram captions. Analyze the provided image and create compelling captions with relevant hashtags and emojis. Keep captions concise but engaging."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: analysisPrompt
              },
              {
                type: "image_url",
                image_url: {
                  url: processedImageUrl
                }
              }
            ]
          }
        ],
        max_tokens: 300,
        temperature: 0.7
      });

      const caption = completion.choices[0].message.content;
      
      res.json({ 
        caption,
        imageUrl: processedImageUrl 
      });
    } catch (visionError) {
      // If vision fails, fall back to text-based generation
      console.log('Vision API failed, using text-based generation:', visionError.message);
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a social media expert who creates engaging Instagram captions."
          },
          {
            role: "user",
            content: `Create an engaging Instagram caption for an image. ${analysisPrompt} Make it creative and include relevant hashtags and emojis.`
          }
        ],
        max_tokens: 300,
        temperature: 0.8
      });
      
      const caption = completion.choices[0].message.content;
      res.json({ caption, imageUrl: processedImageUrl });
    }
    
  } catch (error) {
    console.error('Image analysis error:', error);
    
    // Handle specific OpenAI API errors
    if (error.message?.includes('Invalid image URL')) {
      return res.status(400).json({ error: 'Invalid image URL. Please ensure the image is publicly accessible.' });
    }
    
    res.status(500).json({ error: 'Failed to analyze image and generate caption' });
  }
});

export default router;
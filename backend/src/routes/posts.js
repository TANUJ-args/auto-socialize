import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all posts for user
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, platform } = req.query;
    
    const where = { userId: req.userId };
    
    if (status) {
      where.status = status;
    }
    
    if (platform) {
      where.platforms = { has: platform };
    }
    
    const posts = await prisma.post.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({ posts });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ error: 'Failed to get posts' });
  }
});

// Get single post
router.get('/:id', authenticate, async (req, res) => {
  try {
    const post = await prisma.post.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId
      }
    });
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    res.json({ post });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ error: 'Failed to get post' });
  }
});

// Create post
router.post('/', authenticate, async (req, res) => {
  try {
    console.log('📝 Creating post - Body size:', JSON.stringify(req.body).length, 'bytes');
    
    const { 
      title, 
      content, 
      postType, 
      mediaUrl, 
      scheduledDate, 
      status, 
      platforms,
      aiGenerated,
      prompt 
    } = req.body;
    
    console.log('📝 Post details:', {
      title,
      contentLength: content?.length,
      postType,
      mediaUrlLength: mediaUrl?.length,
      status,
      platforms,
      aiGenerated
    });
    
    // Validate required fields
    if (!content || !postType || !platforms || platforms.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Validate image posts have mediaUrl
    if (postType === 'image' && !mediaUrl) {
      return res.status(400).json({ error: 'Image posts require mediaUrl' });
    }
    
    const post = await prisma.post.create({
      data: {
        userId: req.userId,
        title,
        content,
        postType,
        mediaUrl,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        status: status || 'draft',
        platforms,
        aiGenerated: aiGenerated || false,
        prompt
      }
    });
    
    res.json({ post });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Update post
router.put('/:id', authenticate, async (req, res) => {
  try {
    const post = await prisma.post.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId
      }
    });
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    const { 
      title, 
      content, 
      postType, 
      mediaUrl, 
      scheduledDate, 
      status, 
      platforms 
    } = req.body;
    
    const updatedPost = await prisma.post.update({
      where: { id: req.params.id },
      data: {
        title,
        content,
        postType,
        mediaUrl,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        status,
        platforms
      }
    });
    
    res.json({ post: updatedPost });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ error: 'Failed to update post' });
  }
});

// Delete post
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const post = await prisma.post.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId
      }
    });
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    await prisma.post.delete({
      where: { id: req.params.id }
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// Get scheduled posts for calendar
router.get('/calendar/scheduled', authenticate, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const where = {
      userId: req.userId,
      status: 'scheduled'
    };
    
    if (startDate && endDate) {
      where.scheduledDate = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }
    
    const posts = await prisma.post.findMany({
      where,
      orderBy: { scheduledDate: 'asc' }
    });
    
    res.json({ posts });
  } catch (error) {
    console.error('Get calendar posts error:', error);
    res.status(500).json({ error: 'Failed to get calendar posts' });
  }
});

export default router;
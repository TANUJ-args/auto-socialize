import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import axios from 'axios';

const router = express.Router();
const prisma = new PrismaClient();

// Get all social accounts
router.get('/', authenticate, async (req, res) => {
  try {
    const accounts = await prisma.socialAccount.findMany({
      where: { userId: req.userId }
    });
    
    res.json({ accounts });
  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({ error: 'Failed to get social accounts' });
  }
});

// Verify Instagram account
router.post('/instagram/verify', authenticate, async (req, res) => {
  try {
    const account = await prisma.socialAccount.findFirst({
      where: {
        userId: req.userId,
        platform: 'instagram'
      }
    });
    
    if (!account) {
      return res.status(404).json({ error: 'Instagram account not connected' });
    }
    
    // Verify token with Instagram API
    const response = await axios.get(
      `https://graph.instagram.com/me?fields=id,username&access_token=${account.accessToken}`
    );
    
    if (response.data.id !== account.accountId) {
      return res.status(400).json({ error: 'Account verification failed' });
    }
    
    res.json({ 
      success: true, 
      account: {
        username: response.data.username,
        id: response.data.id
      }
    });
  } catch (error) {
    console.error('Verify Instagram error:', error);
    res.status(500).json({ error: 'Failed to verify Instagram account' });
  }
});

// Disconnect account
router.delete('/:platform', authenticate, async (req, res) => {
  try {
    const { platform } = req.params;
    
    await prisma.socialAccount.deleteMany({
      where: {
        userId: req.userId,
        platform
      }
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Disconnect account error:', error);
    res.status(500).json({ error: 'Failed to disconnect account' });
  }
});

export default router;
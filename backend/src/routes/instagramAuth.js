import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import axios from 'axios';

const router = express.Router();
const prisma = new PrismaClient();

// Instagram OAuth configuration
const INSTAGRAM_CONFIG = {
  CLIENT_ID: process.env.FACEBOOK_APP_ID,
  CLIENT_SECRET: process.env.FACEBOOK_APP_SECRET,
  REDIRECT_URI: process.env.INSTAGRAM_REDIRECT_URI,
  SCOPE: 'instagram_basic,instagram_content_publish,pages_show_list'
};

/**
 * Start Instagram OAuth flow
 */
router.get('/connect', authenticate, async (req, res) => {
  try {
    const { userId } = req;
    
    // Generate state parameter for CSRF protection
    const state = Buffer.from(JSON.stringify({
      userId,
      timestamp: Date.now(),
      nonce: Math.random().toString(36).substring(7)
    })).toString('base64');
    
    const authUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth');
    authUrl.searchParams.append('client_id', INSTAGRAM_CONFIG.CLIENT_ID);
    authUrl.searchParams.append('redirect_uri', INSTAGRAM_CONFIG.REDIRECT_URI);
    authUrl.searchParams.append('scope', INSTAGRAM_CONFIG.SCOPE);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('state', state);
    
    res.json({
      success: true,
      authUrl: authUrl.toString(),
      message: 'Visit the auth URL to connect your Instagram Business account'
    });
  } catch (error) {
    console.error('[IG Auth] Connect error:', error);
    res.status(500).json({ error: 'Failed to initiate Instagram connection' });
  }
});

/**
 * Handle Instagram OAuth callback
 */
router.get('/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;
    
    if (error) {
      console.error('[IG Auth] OAuth error:', error);
      return res.status(400).json({ error: 'Instagram authentication failed' });
    }
    
    if (!code || !state) {
      return res.status(400).json({ error: 'Missing authorization code or state' });
    }
    
    // Verify state parameter
    let stateData;
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    } catch (e) {
      return res.status(400).json({ error: 'Invalid state parameter' });
    }
    
    // Check state timestamp (expire after 10 minutes)
    if (Date.now() - stateData.timestamp > 10 * 60 * 1000) {
      return res.status(400).json({ error: 'State parameter expired' });
    }
    
    // Exchange code for access token
    const tokenResponse = await axios.post('https://graph.facebook.com/v18.0/oauth/access_token', {
      client_id: INSTAGRAM_CONFIG.CLIENT_ID,
      client_secret: INSTAGRAM_CONFIG.CLIENT_SECRET,
      redirect_uri: INSTAGRAM_CONFIG.REDIRECT_URI,
      code
    });

    const { access_token } = tokenResponse.data;
    
    // Get user's Facebook pages
    const pagesResponse = await axios.get('https://graph.facebook.com/v18.0/me/accounts', {
      params: {
        access_token,
        fields: 'id,name,instagram_business_account'
      }
    });
    
    // Find Instagram Business accounts
    const instagramAccounts = [];
    for (const page of pagesResponse.data.data) {
      if (page.instagram_business_account) {
        // Get Instagram account details
        const igResponse = await axios.get(`https://graph.facebook.com/v18.0/${page.instagram_business_account.id}`, {
          params: {
            access_token,
            fields: 'id,username,account_type,profile_picture_url'
          }
        });
        
        instagramAccounts.push({
          id: page.instagram_business_account.id,
          username: igResponse.data.username,
          account_type: igResponse.data.account_type,
          profile_picture_url: igResponse.data.profile_picture_url,
          page_id: page.id,
          page_name: page.name,
          access_token
        });
      }
    }
    
    if (instagramAccounts.length === 0) {
      return res.status(400).json({ 
        error: 'No Instagram Business accounts found. Please ensure your Instagram account is converted to a Business account and linked to a Facebook Page.' 
      });
    }
    
    // Save Instagram accounts to database
    for (const account of instagramAccounts) {
      await prisma.socialAccount.upsert({
        where: {
          userId_platform_accountId: {
            userId: stateData.userId,
            platform: 'instagram',
            accountId: account.id
          }
        },
        update: {
          accessToken: account.access_token,
          accountData: account,
          isActive: true
        },
        create: {
          userId: stateData.userId,
          platform: 'instagram',
          accountId: account.id,
          accountName: account.username,
          accessToken: account.access_token,
          accountData: account,
          isActive: true
        }
      });
    }
    
    console.log('[IG Auth] Successfully connected Instagram accounts:', instagramAccounts.length);
    
    // Redirect to success page
    res.redirect(`${process.env.CLIENT_URL}/dashboard?instagram_connected=true`);
    
  } catch (error) {
    console.error('[IG Auth] Callback error:', error);
    res.status(500).json({ error: 'Failed to complete Instagram authentication' });
  }
});

/**
 * Get connected Instagram accounts
 */
router.get('/accounts', authenticate, async (req, res) => {
  try {
    const { userId } = req;
    
    const accounts = await prisma.socialAccount.findMany({
      where: {
        userId,
        platform: 'instagram',
        isActive: true
      }
    });
    
    res.json({ 
      success: true, 
      accounts: accounts.map(acc => ({
        id: acc.accountId,
        username: acc.accountName,
        profile_picture_url: acc.accountData?.profile_picture_url,
        account_type: acc.accountData?.account_type,
        connected_at: acc.createdAt
      }))
    });
  } catch (error) {
    console.error('[IG Auth] Get accounts error:', error);
    res.status(500).json({ error: 'Failed to fetch Instagram accounts' });
  }
});

/**
 * Disconnect Instagram account
 */
router.delete('/disconnect/:accountId', authenticate, async (req, res) => {
  try {
    const { userId } = req;
    const { accountId } = req.params;
    
    await prisma.socialAccount.updateMany({
      where: {
        userId,
        platform: 'instagram',
        accountId
      },
      data: {
        isActive: false
      }
    });
    
    res.json({ success: true, message: 'Instagram account disconnected' });
  } catch (error) {
    console.error('[IG Auth] Disconnect error:', error);
    res.status(500).json({ error: 'Failed to disconnect Instagram account' });
  }
});

export default router;
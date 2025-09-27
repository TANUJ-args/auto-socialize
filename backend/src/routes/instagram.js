import express from 'express';
import crypto from 'crypto';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { uploadBase64Image } from '../services/cloudinary.js';
import { checkUsageLimit, trackUsage } from '../services/billing.js';

const router = express.Router();
const prisma = new PrismaClient();

const FB_VERSION = 'v18.0';
const GRAPH_BASE = `https://graph.facebook.com/${FB_VERSION}`;

// Health check for Instagram routes
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    endpoints: ['oauth/start', 'oauth/callback', 'verify', 'validate-token', 'create-post', 'uploads/:filename'],
    timestamp: new Date().toISOString() 
  });
});

// Serve uploaded images
router.get('/uploads/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    // Use absolute path from backend directory
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const filePath = path.join(uploadsDir, filename);
    
    console.log('[IG][uploads] Serving file:', filePath);
    
    if (!fs.existsSync(filePath)) {
      console.log('[IG][uploads] File not found:', filePath);
      return res.status(404).json({ error: 'Image not found' });
    }
    
    // Set appropriate headers
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp'
    };
    
    const mimeType = mimeTypes[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    res.setHeader('Access-Control-Allow-Origin', '*'); // Allow cross-origin access
    
    // Send the file
    res.sendFile(filePath);
  } catch (error) {
    console.error('Error serving uploaded image:', error);
    res.status(500).json({ error: 'Failed to serve image' });
  }
});

function base64url(input) {
  return Buffer.from(input).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function fromBase64Url(input) {
  input = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = input.length % 4;
  if (pad) input += '='.repeat(4 - pad);
  return Buffer.from(input, 'base64').toString();
}

function signState(payload, secret) {
  const msg = JSON.stringify(payload);
  const mac = crypto.createHmac('sha256', secret).update(msg).digest('hex');
  return base64url(JSON.stringify({ ...payload, s: mac }));
}

function verifyState(state, secret, maxAgeSeconds = 10 * 60) {
  try {
    const decoded = JSON.parse(fromBase64Url(state));
    const { u, t, n, s } = decoded;
    const msg = JSON.stringify({ u, t, n });
    const mac = crypto.createHmac('sha256', secret).update(msg).digest('hex');
    if (!crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(s))) return null;
    const age = Math.floor(Date.now() / 1000) - t;
    if (age < 0 || age > maxAgeSeconds) return null;
    return { userId: u, ts: t, nonce: n };
  } catch {
    return null;
  }
}

// GET /api/instagram/oauth/start
router.get('/oauth/start', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).send('Missing userId');

    const statePayload = { u: String(userId), t: Math.floor(Date.now() / 1000), n: crypto.randomBytes(8).toString('hex') };
    const state = signState(statePayload, process.env.JWT_SECRET);

    const params = new URLSearchParams({
      client_id: process.env.FACEBOOK_APP_ID,
      redirect_uri: process.env.INSTAGRAM_REDIRECT_URI,
      state,
      scope: 'instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement',
      response_type: 'code'
    });

    const url = `https://www.facebook.com/${FB_VERSION}/dialog/oauth?${params.toString()}`;
    return res.redirect(url);
  } catch (err) {
    console.error('OAuth start error:', err);
    return res.status(500).send('OAuth start failed');
  }
});

// Utility to respond and close popup
function popupCloseHtml(payload) {
  const json = JSON.stringify(payload);
  return `<!doctype html><html><body><script>\ntry {\n  if (window.opener) { window.opener.postMessage({ type: 'instagram-oauth', payload: ${JSON.stringify(json)} }, '*'); }\n} catch (e) {}\nwindow.close();\n</script></body></html>`;
}

// GET /api/instagram/oauth/callback
router.get('/oauth/callback', async (req, res) => {
  const { code, state } = req.query;
  try {
    if (!code || !state) return res.status(400).send('Missing code/state');
    const parsed = verifyState(String(state), process.env.JWT_SECRET);
    if (!parsed) return res.status(400).send('Invalid state');
    const userId = parsed.userId;

    // Exchange code -> short-lived user token
    const tokenRes = await axios.get(`https://graph.facebook.com/${FB_VERSION}/oauth/access_token`, {
      params: {
        client_id: process.env.FACEBOOK_APP_ID,
        client_secret: process.env.FACEBOOK_APP_SECRET,
        redirect_uri: process.env.INSTAGRAM_REDIRECT_URI,
        code
      }
    });
    const shortToken = tokenRes.data.access_token;

    // Exchange short -> long-lived user token
    const longRes = await axios.get(`https://graph.facebook.com/${FB_VERSION}/oauth/access_token`, {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: process.env.FACEBOOK_APP_ID,
        client_secret: process.env.FACEBOOK_APP_SECRET,
        fb_exchange_token: shortToken
      }
    });
    const userLongToken = longRes.data.access_token;
    const expiresSec = longRes.data.expires_in || 60 * 24 * 60 * 60; // default 60 days
    const tokenExpiry = new Date(Date.now() + expiresSec * 1000);

    // Get pages and linked IG business accounts
    const pagesRes = await axios.get(`https://graph.facebook.com/${FB_VERSION}/me/accounts`, {
      params: {
        fields: 'id,name,access_token,instagram_business_account',
        access_token: userLongToken
      }
    });

    const pages = pagesRes.data.data || [];
    let connected = [];

    for (const pg of pages) {
      const ig = pg.instagram_business_account;
      if (!ig?.id) continue;
      // Fetch IG profile details using page access token
      const igRes = await axios.get(`https://graph.facebook.com/${FB_VERSION}/${ig.id}`, {
        params: {
          fields: 'username,profile_picture_url',
          access_token: pg.access_token
        }
      });
      const username = igRes.data.username;
      const profileImage = igRes.data.profile_picture_url || null;

      // Upsert social account for this user
      const existing = await prisma.socialAccount.findFirst({
        where: { userId, platform: 'instagram' }
      });
      
      let savedAccount;
      if (existing) {
        savedAccount = await prisma.socialAccount.update({
          where: { id: existing.id },
          data: {
            accountId: ig.id,
            username,
            displayName: pg.name ?? null,
            profileImage,
            accessToken: pg.access_token, // store page token to operate on IG account
            tokenExpiry,
            isActive: true
          }
        });
        console.log('[IG][oauth-callback] Updated existing account:', { userId, igId: ig.id, username });
      } else {
        savedAccount = await prisma.socialAccount.create({
          data: {
            userId,
            platform: 'instagram',
            accountId: ig.id,
            username,
            displayName: pg.name ?? null,
            profileImage,
            accessToken: pg.access_token,
            tokenExpiry,
            isActive: true
          }
        });
        console.log('[IG][oauth-callback] Created new account:', { userId, igId: ig.id, username });
      }
      
      // Immediate verification to ensure the token works
      try {
        await axios.get(`https://graph.facebook.com/${FB_VERSION}/${ig.id}`, {
          params: { fields: 'id,username', access_token: pg.access_token }
        });
        console.log('[IG][oauth-callback] Verification successful:', { igId: ig.id, username });
      } catch (verifyErr) {
        console.warn('[IG][oauth-callback] Verification warning:', verifyErr?.response?.data || verifyErr.message);
      }
      
      connected.push({ accountId: ig.id, username, verified: true });
    }

    if (connected.length === 0) {
      return res.send(popupCloseHtml({ success: false, error: 'No Instagram Business Accounts found on your Pages' }));
    }

    return res.send(popupCloseHtml({ success: true, connected }));
  } catch (err) {
    console.error('OAuth callback error:', err?.response?.data || err.message);
    return res.send(popupCloseHtml({ success: false, error: 'OAuth failed' }));
  }
});

// POST /api/instagram/verify
router.post('/verify', authenticate, async (req, res) => {
  try {
    const account = await prisma.socialAccount.findFirst({
      where: { userId: req.userId, platform: 'instagram' }
    });
    if (!account) return res.status(404).json({ error: 'Instagram account not connected' });

    const resp = await axios.get(`https://graph.facebook.com/${FB_VERSION}/${account.accountId}`, {
      params: { fields: 'id,username,profile_picture_url', access_token: account.accessToken }
    });
    return res.json({ success: true, account: { id: resp.data.id, username: resp.data.username, profileImage: resp.data.profile_picture_url || null } });
  } catch (err) {
    const detail = err?.response?.data || err.message;
    console.error('Verify IG error:', detail);
    return res.status(400).json({ success: false, error: detail });
  }
});

/*
 * POST /api/instagram/validate-token
 * Body: { accessToken: string }
 * Validates a user-supplied long-lived IG access token (page token) and returns IG business account info.
 * This does not persist anything—it's an on-demand validation, with logging.
 */
router.post('/validate-token', rateLimit, authenticate, async (req, res) => {
  const started = Date.now();
  try {
    const { accessToken } = req.body || {};
    if (!accessToken || typeof accessToken !== 'string') {
      res.setHeader('X-Response-Time-ms', (Date.now() - started).toString());
      return res.status(400).json({ error: 'accessToken is required' });
    }
    
    // Demo mode for testing
    if (accessToken === 'DEMO_TOKEN_FOR_TESTING') {
      res.setHeader('X-Response-Time-ms', (Date.now() - started).toString());
      return res.json({ 
        valid: true, 
        account: { 
          facebookId: 'demo_123', 
          name: 'Demo Page', 
          igId: 'demo_ig_456', 
          username: 'demo_account' 
        } 
      });
    }
    
    // Demo create-post mode for testing
    if (accessToken === 'DEMO_TOKEN_FOR_TESTING') {
      // Skip this since it's handled above, but this is where we'd add create-post demo logic
    }
    // Get the page associated with the token (debug via /me)
    const meResp = await axios.get(`${GRAPH_BASE}/me`, { params: { access_token: accessToken, fields: 'id,name' } });
    // Try to get IG business account via accounts or directly if token already scoped
    let igId = null;
    let username = null;
    // Some tokens are page tokens; attempt to fetch connected IG business account
    try {
      const pageResp = await axios.get(`${GRAPH_BASE}/me/accounts`, { params: { access_token: accessToken, fields: 'id,name,instagram_business_account' } });
      const pages = pageResp.data?.data || [];
      for (const p of pages) {
        if (p.instagram_business_account?.id) {
          igId = p.instagram_business_account.id;
          break;
        }
      }
    } catch (e) {
      // Non-fatal; continue
    }
    if (!igId) {
      // Maybe the token is already a page token; try to call a likely IG endpoint will fail if wrong
      // We'll skip if not found.
    }
    if (igId) {
      try {
        const igResp = await axios.get(`${GRAPH_BASE}/${igId}`, { params: { access_token: accessToken, fields: 'id,username' } });
        username = igResp.data.username;
      } catch (e) {
        // ignore; maybe insufficient scope
      }
    }
    console.log('[IG][validate-token]', { userId: req.userId, me: meResp.data.id, igId, username });
    res.setHeader('X-Response-Time-ms', (Date.now() - started).toString());
    return res.json({ valid: true, account: { facebookId: meResp.data.id, name: meResp.data.name, igId, username } });
  } catch (err) {
    const detail = err?.response?.data || err.message;
    console.error('[IG][validate-token][error]', detail);
    res.setHeader('X-Response-Time-ms', (Date.now() - started).toString());
    return res.status(400).json({ valid: false, error: detail });
  }
});

/*
 * POST /api/instagram/save-token
 * Body: { accessToken: string }
 * Saves a validated access token for the user by creating/updating a SocialAccount record
 */
router.post('/save-token', authenticate, async (req, res) => {
  const started = Date.now();
  try {
    const { accessToken } = req.body || {};
    if (!accessToken) {
      res.setHeader('X-Response-Time-ms', (Date.now() - started).toString());
      return res.status(400).json({ error: 'accessToken is required' });
    }

    // Get Instagram account info from the token
    let igId = null;
    let username = null;
    let facebookId = null;
    let pageName = null;

    // Get the page associated with the token
    const meResp = await axios.get(`${GRAPH_BASE}/me`, { 
      params: { access_token: accessToken, fields: 'id,name' } 
    });
    facebookId = meResp.data.id;
    pageName = meResp.data.name;

    // Try to get IG business account
    try {
      const pagesResp = await axios.get(`${GRAPH_BASE}/me/accounts`, { 
        params: { access_token: accessToken, fields: 'id,name,instagram_business_account' } 
      });
      const pages = pagesResp.data?.data || [];
      for (const p of pages) {
        if (p.instagram_business_account?.id) {
          igId = p.instagram_business_account.id;
          // Get IG username
          try {
            const igResp = await axios.get(`${GRAPH_BASE}/${igId}`, {
              params: { access_token: accessToken, fields: 'username,profile_picture_url' }
            });
            username = igResp.data.username;
          } catch (e) {
            console.warn('Could not fetch IG username:', e.message);
          }
          break;
        }
      }
    } catch (e) {
      console.warn('Could not fetch IG business account:', e.message);
    }

    // Save or update the social account
    const existing = await prisma.socialAccount.findFirst({
      where: { userId: req.userId, platform: 'instagram' }
    });

    if (existing) {
      await prisma.socialAccount.update({
        where: { id: existing.id },
        data: {
          accountId: igId || facebookId,
          username: username || 'Unknown',
          displayName: pageName,
          accessToken,
          tokenExpiry: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
          isActive: true
        }
      });
      console.log('[IG][save-token] Updated account for user:', req.userId);
    } else {
      await prisma.socialAccount.create({
        data: {
          userId: req.userId,
          platform: 'instagram',
          accountId: igId || facebookId,
          username: username || 'Unknown',
          displayName: pageName,
          accessToken,
          tokenExpiry: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
          isActive: true
        }
      });
      console.log('[IG][save-token] Created new account for user:', req.userId);
    }

    res.setHeader('X-Response-Time-ms', (Date.now() - started).toString());
    return res.json({ success: true, username, igId });
  } catch (err) {
    const detail = err?.response?.data || err.message;
    console.error('[IG][save-token][error]', detail);
    res.setHeader('X-Response-Time-ms', (Date.now() - started).toString());
    return res.status(400).json({ success: false, error: detail });
  }
});

/*
 * POST /api/instagram/create-post
 * Body: { accessToken: string, caption: string, mediaUrl: string, mediaType?: 'IMAGE' | 'VIDEO', title?: string }
 * Workflow:
 * 1. Resolve IG user (business) ID using the token (via pages→instagram_business_account or provided token context).
 * 2. Create media container.
 * 3. Publish container.
 * Returns publication id or error. This is a synchronous flow (5-10s typical).
 */
router.post('/create-post', rateLimit, authenticate, async (req, res) => {
  const started = Date.now();
  const logCtx = { userId: req.userId };
  try {
    // Debug: Log safe request info (excluding sensitive data)
    const { accessToken: requestToken, ...safeRequestData } = req.body || {};
    console.log('[IG][create-post] Request data (safe):', JSON.stringify(safeRequestData, null, 2));
    console.log('[IG][create-post] Content-Type:', req.headers['content-type']);
    console.log('[IG][create-post] Has access token:', !!requestToken);
    if (requestToken) {
      console.log('[IG][create-post] Token preview:', requestToken.substring(0, 8) + '...' + requestToken.substring(requestToken.length - 8));
    }
    
    // Check usage limits first
    const usageCheck = await checkUsageLimit(req.userId, 'posts');
    if (!usageCheck.allowed) {
      return res.status(429).json({ 
        error: 'Post publishing limit reached', 
        limit: usageCheck.limit,
        used: usageCheck.used,
        message: 'Upgrade your plan to publish more posts this month'
      });
    }

    let { accessToken: providedToken, caption, mediaUrl, mediaType = 'IMAGE', title, isReels = false } = req.body || {};
    
    console.log('[IG][create-post] Parsed fields:', { 
      hasAccessToken: !!providedToken, 
      caption: caption?.substring(0, 50) + '...', 
      mediaUrl: mediaUrl?.substring(0, 100) + '...', 
      mediaType, 
      isReels 
    });
    
    // Use provided token or fallback to environment token
    const accessToken = providedToken || process.env.INSTAGRAM_ACCESS_TOKEN;
    if (!accessToken) return res.status(400).json({ error: 'Instagram access token required. Please connect your Instagram account or configure INSTAGRAM_ACCESS_TOKEN environment variable.' });
    if (!caption) return res.status(400).json({ error: 'caption required' });
    if (!mediaUrl) return res.status(400).json({ error: 'mediaUrl required' });
    
    // Convert cloud storage sharing URLs to direct download URLs
    const originalMediaUrl = mediaUrl;
    
    // Check for Google Drive sharing URL patterns and convert them
    const driveShareRegex = /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)\/(view|edit)/;
    const docsShareRegex = /https:\/\/docs\.google\.com\/.*\/d\/([a-zA-Z0-9_-]+)\//;
    
    let driveMatch = mediaUrl.match(driveShareRegex);
    let docsMatch = mediaUrl.match(docsShareRegex);
    
    if (driveMatch) {
      const fileId = driveMatch[1];
      mediaUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
      console.log('[IG][create-post] 🔗 Google Drive URL converted:', {
        original: originalMediaUrl,
        converted: mediaUrl,
        fileId
      });
    } else if (docsMatch) {
      const fileId = docsMatch[1];
      mediaUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
      console.log('[IG][create-post] 🔗 Google Docs URL converted:', {
        original: originalMediaUrl,
        converted: mediaUrl,
        fileId
      });
    } else {
      // Check for Dropbox sharing URLs (handles new scl/fi format)
      const dropboxShareRegex = /https:\/\/www\.dropbox\.com\/scl\/fi\/[^?]+/;
      const dropboxLegacyRegex = /https:\/\/(www\.)?dropbox\.com\/s\/[^?]+/;
      
      let dropboxMatch = mediaUrl.match(dropboxShareRegex);
      let dropboxLegacyMatch = mediaUrl.match(dropboxLegacyRegex);
      
      if (dropboxMatch && mediaUrl.includes('dl=0')) {
        mediaUrl = mediaUrl.replace('dl=0', 'dl=1');
        console.log('[IG][create-post] 🔗 Dropbox URL converted:', {
          original: originalMediaUrl,
          converted: mediaUrl
        });
      } else if (dropboxLegacyMatch) {
        mediaUrl = mediaUrl.includes('?') ? mediaUrl.replace(/dl=0/, 'dl=1') : mediaUrl + '?dl=1';
        console.log('[IG][create-post] 🔗 Dropbox Legacy URL converted:', {
          original: originalMediaUrl,
          converted: mediaUrl
        });
      }
    }
    
    // Handle base64 data URLs - upload to Cloudinary CDN or use demo image
    console.log('[IG][create-post] Original mediaUrl type:', mediaUrl.startsWith('data:image/') ? 'base64' : 'url');
    
    if (mediaUrl.startsWith('data:image/')) {
      console.log('[IG][create-post] Base64 image detected, length:', mediaUrl.length);
      
      try {
        // Check if Cloudinary is configured (not just set, but with real values)
        const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && 
                                      process.env.CLOUDINARY_API_KEY && 
                                      process.env.CLOUDINARY_API_SECRET &&
                                      !process.env.CLOUDINARY_CLOUD_NAME.includes('your_') &&
                                      !process.env.CLOUDINARY_API_KEY.includes('your_') &&
                                      !process.env.CLOUDINARY_API_SECRET.includes('your_');
        
        if (isCloudinaryConfigured) {
          console.log('[IG][create-post] Cloudinary configured, uploading...');
          const base64Data = mediaUrl.split(',')[1];
          if (!base64Data) {
            throw new Error('Invalid base64 data format');
          }
          
          const uploadResult = await uploadBase64Image(base64Data, 'instagram-posts');
          mediaUrl = uploadResult.secure_url || uploadResult.url;
          console.log('[IG][create-post] ✅ Image uploaded to Cloudinary successfully:', mediaUrl);
        } else {
          console.log('[IG][create-post] ⚠️ Cloudinary not configured, using demo image...');
          console.log('[IG][create-post] Missing env vars:', {
            CLOUDINARY_CLOUD_NAME: !!process.env.CLOUDINARY_CLOUD_NAME,
            CLOUDINARY_API_KEY: !!process.env.CLOUDINARY_API_KEY,
            CLOUDINARY_API_SECRET: !!process.env.CLOUDINARY_API_SECRET
          });
          mediaUrl = `https://picsum.photos/1080/1080?random=${Date.now()}`;
        }
      } catch (error) {
        console.error('[IG][create-post] ❌ Image processing failed:', error.message);
        mediaUrl = `https://picsum.photos/1080/1080?random=${Date.now()}`;
      }
      
      console.log('[IG][create-post] 🎯 Final processed mediaUrl:', mediaUrl);
    } else if (!/^https?:\/\//i.test(mediaUrl)) {
      return res.status(400).json({ error: 'mediaUrl must be http(s) URL or base64 data URL' });
    }
    
    // Validate Reels requirements
    if (isReels && mediaType !== 'VIDEO') {
      return res.status(400).json({ error: 'Reels must be video content' });
    }

    // Demo mode for testing or when access token has issues
    if (accessToken === 'DEMO_TOKEN_FOR_TESTING' || !accessToken || accessToken.length < 10) {
      console.log('[IG][create-post][demo]', { mediaType, caption: caption.slice(0, 50), isReels });
      
      // Simulate processing time for videos
      if (mediaType === 'VIDEO') {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
      }
      
      // Track usage for billing even in demo mode
      await trackUsage(req.userId, 'postsPublished', 1);
      
      res.setHeader('X-Response-Time-ms', (Date.now() - started).toString());
      return res.json({ 
        success: true, 
        message: 'Demo mode: Post would be published to Instagram',
        igId: 'demo_ig_456', 
        containerId: `demo_container_${Date.now()}`,
        publishedId: `demo_post_${Date.now()}`,
        mediaUrl: mediaUrl,
        caption: caption
      });
    }

    // Enhanced media URL validation
    try {
      console.log('[IG][create-post] Validating media URL accessibility...');
      
      // For Google Drive URLs, check if they're properly converted
      if (mediaUrl.includes('drive.google.com') && !mediaUrl.includes('uc?export=download')) {
        return res.status(400).json({ 
          error: 'Google Drive URL not properly converted. Please use sharing links like: https://drive.google.com/file/d/XXXXX/view' 
        });
      }
      
      // Check URL accessibility with proper headers
      const headResponse = await axios.head(mediaUrl, { 
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      console.log('[IG][create-post] URL validation successful:', {
        status: headResponse.status,
        contentType: headResponse.headers['content-type'],
        contentLength: headResponse.headers['content-length']
      });
      
      // Enhanced validation for video files
      if (mediaType === 'VIDEO') {
        const contentType = headResponse.headers['content-type'];
        const contentLength = parseInt(headResponse.headers['content-length']) || 0;
        
        // Special handling for cloud storage URLs - they might return incorrect content types
        const isDropboxUrl = mediaUrl.includes('dropbox.com');
        const isGoogleDriveUrl = mediaUrl.includes('drive.google.com');
        const hasVideoExtension = /\.(mp4|mov|avi|mkv|m4v|webm)(\?|$)/i.test(mediaUrl);
        
        // Only validate content type for direct URLs, not cloud storage which can return incorrect types
        if (contentType && !contentType.includes('video/') && !isDropboxUrl && !isGoogleDriveUrl && !hasVideoExtension) {
          return res.status(400).json({ 
            error: `URL points to ${contentType}, but expected video content. Please ensure the URL is a direct link to a video file.` 
          });
        }
        
        // Log warning for cloud storage URLs with unexpected content types
        if ((isDropboxUrl || isGoogleDriveUrl) && contentType && !contentType.includes('video/')) {
          console.log('[IG][create-post][cloud-storage-warning]', {
            service: isDropboxUrl ? 'Dropbox' : 'Google Drive',
            reportedContentType: contentType,
            hasVideoExtension,
            message: 'Cloud storage returned non-video content type, but proceeding based on file extension'
          });
        }
        
        // Check file size limits (Instagram has limits)
        const maxSizeBytes = 100 * 1024 * 1024; // 100MB limit for videos
        if (contentLength > maxSizeBytes) {
          return res.status(400).json({ 
            error: `Video file is too large (${Math.round(contentLength / 1024 / 1024)}MB). Instagram supports videos up to 100MB. Please compress your video.`,
            details: {
              currentSize: `${Math.round(contentLength / 1024 / 1024)}MB`,
              maxSize: '100MB',
              suggestion: 'Use video compression tools to reduce file size while maintaining quality'
            }
          });
        }
        
        // Log video details for debugging
        console.log('[IG][create-post][video-details]', {
          contentType,
          sizeBytes: contentLength,
          sizeMB: Math.round(contentLength / 1024 / 1024),
          isReels,
          url: mediaUrl.substring(0, 100) + '...'
        });
      }
      
    } catch (e) {
      console.error('[IG][create-post] URL validation failed:', e.message);
      return res.status(400).json({ 
        error: `Media URL not accessible: ${e.message}. Please ensure the URL is public and points directly to the media file.` 
      });
    }

    // Discover IG business account ID
    let igId = null;
    try {
      const pagesResp = await axios.get(`${GRAPH_BASE}/me/accounts`, { params: { access_token: accessToken, fields: 'id,instagram_business_account' } });
      const pages = pagesResp.data?.data || [];
      for (const p of pages) {
        if (p.instagram_business_account?.id) { igId = p.instagram_business_account.id; break; }
      }
    } catch (e) {
      console.warn('[IG][create-post] pages fetch failed (possible token type)', e?.response?.data || e.message);
    }
    if (!igId) {
      return res.status(400).json({ error: 'Unable to resolve Instagram Business Account ID from token' });
    }

    console.log('[IG][create-post][start]', { ...logCtx, igId, mediaType, isReels });

    // Step 1: Create media container
    const createParams = {
      caption,
      access_token: accessToken
    };
    
    if (mediaType === 'VIDEO') {
      // Set media_type based on whether it's a Reel or regular video
      createParams['media_type'] = isReels ? 'REELS' : 'VIDEO';
      createParams['video_url'] = mediaUrl;
      
      // Add Reels-specific parameters
      if (isReels) {
        createParams['share_to_feed'] = true; // Also share to main feed
      }
    } else {
      createParams['image_url'] = mediaUrl;
    }
    
    let containerResp;
    try {
      console.log('[IG][create-post] Creating media container with params:', { mediaType, isReels, mediaUrl: mediaUrl.substring(0, 100) + '...' });
      
      containerResp = await axios.post(`${GRAPH_BASE}/${igId}/media`, null, { 
        params: createParams, 
        maxBodyLength: Infinity,
        timeout: 30000 // 30 seconds timeout for video uploads
      });
    } catch (containerError) {
      console.error('[IG][create-post][container-creation-failed]', containerError?.response?.data || containerError.message);
      
      const errorData = containerError?.response?.data;
      let errorMessage = 'Failed to create media container';
      
      if (errorData?.error?.message) {
        errorMessage = errorData.error.message;
      } else if (errorData?.error_user_msg) {
        errorMessage = errorData.error_user_msg;
      }
      
      return res.status(400).json({ 
        error: `Instagram API error: ${errorMessage}. Please check your media URL and format.` 
      });
    }
    
    const containerId = containerResp.data.id;
    console.log('[IG][create-post][container-created]', { ...logCtx, containerId, mediaType });

    // Step 2: For videos, check processing status before publishing
    if (mediaType === 'VIDEO') {
      let attempts = 0;
      const maxAttempts = 120; // Wait up to 2 minutes for video processing (was 30 seconds)
      let containerReady = false;
      const baseDelay = 3000; // Start with 3 seconds between checks
      
      while (!containerReady && attempts < maxAttempts) {
        try {
          const statusResp = await axios.get(`${GRAPH_BASE}/${containerId}`, {
            params: { fields: 'status_code', access_token: accessToken },
            timeout: 15000 // 15 second timeout per request
          });
          
          const statusCode = statusResp.data.status_code;
          console.log('[IG][create-post][video-status]', { 
            ...logCtx, 
            containerId, 
            statusCode, 
            attempt: attempts + 1, 
            maxAttempts,
            elapsedSeconds: Math.round(attempts * 3)
          });
          
          if (statusCode === 'FINISHED') {
            containerReady = true;
            console.log('[IG][create-post][video-ready]', { 
              containerId, 
              totalAttempts: attempts + 1,
              totalTimeSeconds: Math.round(attempts * 3)
            });
          } else if (statusCode === 'ERROR') {
            console.error('[IG][create-post][video-processing-error]', { containerId, mediaUrl, mediaType, isReels });
            return res.status(400).json({ 
              error: 'Video processing failed on Instagram servers. Common causes: unsupported format, file too large, or invalid video codec. Try MP4 format with H.264 codec.',
              details: {
                suggestion: 'For best results, use MP4 format with H.264 video codec, AAC audio codec, and keep videos under 60 seconds'
              }
            });
          } else {
            // Status is IN_PROGRESS, wait and retry with progressive delay
            const delay = Math.min(baseDelay + (attempts * 200), 8000); // Gradually increase delay, max 8 seconds
            console.log('[IG][create-post][video-processing]', { 
              containerId, 
              statusCode, 
              attempt: attempts + 1, 
              maxAttempts,
              nextDelayMs: delay,
              elapsedSeconds: Math.round(attempts * 3)
            });
            await new Promise(resolve => setTimeout(resolve, delay));
            attempts++;
          }
        } catch (statusErr) {
          const isTimeout = statusErr.code === 'ECONNABORTED' || statusErr.message.includes('timeout');
          console.warn('[IG][create-post][video-status-check-failed]', { 
            error: statusErr?.response?.data || statusErr.message,
            attempt: attempts + 1,
            isTimeout,
            elapsedSeconds: Math.round(attempts * 3)
          });
          
          // If it's a timeout, wait longer before retrying
          const delay = isTimeout ? 8000 : 3000;
          await new Promise(resolve => setTimeout(resolve, delay));
          attempts++;
        }
      }
      
      if (!containerReady) {
        const totalTimeMinutes = Math.round((attempts * 3) / 60 * 10) / 10; // Round to 1 decimal
        console.error('[IG][create-post][video-timeout]', { 
          containerId, 
          totalAttempts: attempts, 
          maxAttempts,
          totalTimeMinutes
        });
        return res.status(408).json({ 
          error: 'Video processing timeout. Instagram servers are taking longer than expected to process your video.',
          details: {
            timeoutAfter: `${totalTimeMinutes} minutes`,
            attempts: attempts,
            suggestion: 'Try uploading a shorter video (under 30 seconds), compress the file to reduce size, or use MP4 format with H.264 codec. Large or complex videos may take longer to process.'
          }
        });
      }
    }

    // Step 3: Publish container
    console.log('[IG][create-post][publishing]', { containerId, igId });
    const publishResp = await axios.post(`${GRAPH_BASE}/${igId}/media_publish`, null, { 
      params: { creation_id: containerId, access_token: accessToken },
      timeout: 30000 // Increased to 30 seconds timeout for publish
    });
    const publishedId = publishResp.data.id;
    console.log('[IG][create-post][published]', { ...logCtx, publishedId, mediaType, isReels });

    // Track usage for billing
    await trackUsage(req.userId, 'postsPublished', 1);

    // Optional: store post reference in internal DB as a Post if desired
    try {
      await prisma.post.create({
        data: {
          userId: req.userId,
            title: title || caption.slice(0, 50),
            content: caption,
            postType: mediaType === 'VIDEO' ? 'video' : 'image',
            mediaUrl,
            status: 'published',
            platforms: ['instagram'],
            publishResults: { publishedId }
        }
      });
    } catch (e) {
      console.warn('[IG][create-post][db-save-failed]', e.message);
    }

    res.setHeader('X-Response-Time-ms', (Date.now() - started).toString());
    return res.json({ 
      success: true, 
      igId, 
      containerId, 
      publishedId,
      data: { 
        id: publishedId, 
        mediaType,
        isReels,
        message: isReels ? 'Reel posted successfully to Instagram!' : `${mediaType === 'VIDEO' ? 'Video' : 'Image'} posted successfully to Instagram` 
      }
    });
  } catch (err) {
    console.error('[IG][create-post][error]', {
      message: err.message,
      response: err?.response?.data,
      status: err?.response?.status,
      mediaUrl: mediaUrl?.substring(0, 100) + '...',
      mediaType,
      isReels
    });
    
    let errorMessage = 'Failed to create post';
    const errorData = err?.response?.data;
    
    if (err.message?.includes('timeout')) {
      errorMessage = 'Request timed out. For videos, try a shorter duration or smaller file size.';
    } else if (errorData?.error?.message) {
      errorMessage = errorData.error.message;
    } else if (errorData?.error_user_msg) {
      errorMessage = errorData.error_user_msg;
    } else if (err.message) {
      errorMessage = err.message;
    }
    
    res.setHeader('X-Response-Time-ms', (Date.now() - started).toString());
    return res.status(err?.response?.status || 400).json({ 
      success: false, 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? {
        originalError: err.message,
        responseData: errorData
      } : undefined
    });
  }
});

export default router;

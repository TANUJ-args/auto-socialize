import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { 
  getUserAnalytics, 
  getPlatformAnalytics, 
  getRealTimeStats 
} from '../services/analytics.js';

const router = express.Router();

/**
 * Get user's personal analytics
 */
router.get('/user', authenticate, async (req, res) => {
  try {
    const { userId } = req;
    const { days = 30 } = req.query;
    
    const analytics = await getUserAnalytics(userId, parseInt(days));
    
    res.json({
      success: true,
      analytics
    });
  } catch (error) {
    console.error('[Analytics API] Get user analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch user analytics' });
  }
});

/**
 * Get platform-wide analytics (admin only - basic version for now)
 */
router.get('/platform', authenticate, async (req, res) => {
  try {
    // For now, return user's own analytics
    // In production, you'd check for admin role here
    const { userId } = req;
    const { days = 7 } = req.query;
    
    // Basic platform stats that any user can see
    const analytics = await getUserAnalytics(userId, parseInt(days));
    
    res.json({
      success: true,
      analytics: {
        user: analytics,
        note: 'Platform-wide analytics available for admin users'
      }
    });
  } catch (error) {
    console.error('[Analytics API] Get platform analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch platform analytics' });
  }
});

/**
 * Get real-time statistics
 */
router.get('/realtime', authenticate, async (req, res) => {
  try {
    const stats = await getRealTimeStats();
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('[Analytics API] Get real-time stats error:', error);
    res.status(500).json({ error: 'Failed to fetch real-time statistics' });
  }
});

/**
 * Get engagement summary
 */
router.get('/engagement', authenticate, async (req, res) => {
  try {
    const { userId } = req;
    const { days = 7 } = req.query;
    
    const analytics = await getUserAnalytics(userId, parseInt(days));
    
    const engagement = {
      score: analytics.engagement.score,
      level: analytics.engagement.level,
      trends: analytics.trends,
      recommendations: []
    };

    // Generate personalized recommendations
    if (analytics.totals.imagesGenerated < 5) {
      engagement.recommendations.push({
        type: 'generate_images',
        message: 'Try generating more AI images to boost your content creation',
        action: 'Create your first AI-generated image'
      });
    }

    if (analytics.totals.postsPublished < 3) {
      engagement.recommendations.push({
        type: 'publish_posts',
        message: 'Publish more posts to increase your reach',
        action: 'Schedule your next post'
      });
    }

    if (analytics.totals.activeDays < Math.floor(parseInt(days) / 3)) {
      engagement.recommendations.push({
        type: 'stay_active',
        message: 'Try to use the platform more regularly for better results',
        action: 'Set up daily content creation routine'
      });
    }

    if (analytics.engagement.score >= 80) {
      engagement.recommendations.push({
        type: 'great_job',
        message: 'Excellent engagement! Keep up the great work',
        action: 'Share your success with friends'
      });
    }

    res.json({
      success: true,
      engagement
    });
  } catch (error) {
    console.error('[Analytics API] Get engagement error:', error);
    res.status(500).json({ error: 'Failed to fetch engagement data' });
  }
});

export default router;
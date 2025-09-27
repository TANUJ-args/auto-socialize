import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get user engagement analytics
 */
export async function getUserAnalytics(userId, days = 30) {
  try {
    // Handle demo user with mock data
    if (userId === 'demo_user') {
      return {
        period: {
          days,
          startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
          endDate: new Date()
        },
        totals: {
          imagesGenerated: 5,
          postsPublished: 2,
          chatMessages: 12,
          activeDays: 3
        },
        trends: {
          images: 'up',
          posts: 'stable',
          messages: 'up'
        },
        engagement: {
          score: 75,
          level: 'medium',
          mostActiveHour: 14
        },
        dailyStats: [],
        posts: [],
        recentImages: []
      };
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get usage statistics
    const usageStats = await prisma.usageStats.findMany({
      where: {
        userId,
        date: { gte: startDate }
      },
      orderBy: { date: 'asc' }
    });

    // Get post performance
    const posts = await prisma.post.findMany({
      where: {
        userId,
        createdAt: { gte: startDate }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Get chat session activity
    const chatSessions = await prisma.chatSession.findMany({
      where: {
        userId,
        createdAt: { gte: startDate }
      },
      include: {
        messages: {
          select: {
            id: true,
            createdAt: true,
            role: true
          }
        }
      }
    });

    // Get generated images
    const generatedImages = await prisma.generatedImage.findMany({
      where: {
        userId,
        createdAt: { gte: startDate }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate totals
    const totals = {
      imagesGenerated: usageStats.reduce((sum, stat) => sum + (stat.imagesGenerated || 0), 0),
      postsPublished: usageStats.reduce((sum, stat) => sum + (stat.postsPublished || 0), 0),
      chatMessages: usageStats.reduce((sum, stat) => sum + (stat.chatMessages || 0), 0),
      activeDays: usageStats.filter(stat => 
        (stat.imagesGenerated || 0) > 0 || 
        (stat.postsPublished || 0) > 0 || 
        (stat.chatMessages || 0) > 0
      ).length
    };

    // Calculate trends
    const midPoint = Math.floor(usageStats.length / 2);
    const firstHalf = usageStats.slice(0, midPoint);
    const secondHalf = usageStats.slice(midPoint);

    const firstHalfAvg = {
      images: firstHalf.reduce((sum, stat) => sum + (stat.imagesGenerated || 0), 0) / firstHalf.length || 0,
      posts: firstHalf.reduce((sum, stat) => sum + (stat.postsPublished || 0), 0) / firstHalf.length || 0,
      messages: firstHalf.reduce((sum, stat) => sum + (stat.chatMessages || 0), 0) / firstHalf.length || 0
    };

    const secondHalfAvg = {
      images: secondHalf.reduce((sum, stat) => sum + (stat.imagesGenerated || 0), 0) / secondHalf.length || 0,
      posts: secondHalf.reduce((sum, stat) => sum + (stat.postsPublished || 0), 0) / secondHalf.length || 0,
      messages: secondHalf.reduce((sum, stat) => sum + (stat.chatMessages || 0), 0) / secondHalf.length || 0
    };

    const trends = {
      images: secondHalfAvg.images > firstHalfAvg.images ? 'up' : secondHalfAvg.images < firstHalfAvg.images ? 'down' : 'stable',
      posts: secondHalfAvg.posts > firstHalfAvg.posts ? 'up' : secondHalfAvg.posts < firstHalfAvg.posts ? 'down' : 'stable',
      messages: secondHalfAvg.messages > firstHalfAvg.messages ? 'up' : secondHalfAvg.messages < firstHalfAvg.messages ? 'down' : 'stable'
    };

    // Get most active hours
    const messagesByHour = chatSessions.flatMap(session => 
      session.messages.map(msg => new Date(msg.createdAt).getHours())
    );
    
    const hourCounts = {};
    messagesByHour.forEach(hour => {
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const mostActiveHour = Object.keys(hourCounts).reduce((a, b) => 
      hourCounts[a] > hourCounts[b] ? a : b, 0
    );

    // Calculate engagement score (0-100)
    const engagementScore = Math.min(100, Math.floor(
      (totals.activeDays * 5) + 
      (Math.min(totals.imagesGenerated, 20) * 2) + 
      (Math.min(totals.postsPublished, 10) * 3) + 
      (Math.min(totals.chatMessages, 50) * 0.5)
    ));

    return {
      period: {
        days,
        startDate,
        endDate: new Date()
      },
      totals,
      trends,
      engagement: {
        score: engagementScore,
        level: engagementScore >= 80 ? 'high' : engagementScore >= 50 ? 'medium' : 'low',
        mostActiveHour: parseInt(mostActiveHour)
      },
      dailyStats: usageStats,
      posts: posts.slice(0, 10), // Recent 10 posts
      recentImages: generatedImages.slice(0, 5) // Recent 5 images
    };
  } catch (error) {
    console.error('[Analytics] Get user analytics error:', error);
    throw error;
  }
}

/**
 * Get platform-wide analytics (admin only)
 */
export async function getPlatformAnalytics(days = 7) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Total users
    const totalUsers = await prisma.user.count();
    const newUsers = await prisma.user.count({
      where: { createdAt: { gte: startDate } }
    });

    // Active users
    const activeUsers = await prisma.usageStats.groupBy({
      by: ['userId'],
      where: {
        date: { gte: startDate }
      },
      _sum: {
        imagesGenerated: true,
        postsPublished: true,
        chatMessages: true
      }
    });

    const activeUserCount = activeUsers.filter(user => 
      (user._sum.imagesGenerated || 0) > 0 ||
      (user._sum.postsPublished || 0) > 0 ||
      (user._sum.chatMessages || 0) > 0
    ).length;

    // Subscription distribution
    const subscriptions = await prisma.subscription.groupBy({
      by: ['plan'],
      _count: { plan: true }
    });

    // Usage totals
    const usageTotals = await prisma.usageStats.aggregate({
      where: { date: { gte: startDate } },
      _sum: {
        imagesGenerated: true,
        postsPublished: true,
        chatMessages: true,
        apiCalls: true
      }
    });

    // Most popular image models
    const generatedImages = await prisma.generatedImage.findMany({
      where: { createdAt: { gte: startDate } },
      select: { model: true }
    });

    const modelCounts = {};
    generatedImages.forEach(img => {
      modelCounts[img.model] = (modelCounts[img.model] || 0) + 1;
    });

    const topModels = Object.entries(modelCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([model, count]) => ({ model, count }));

    // Platform growth rate
    const previousPeriodStart = new Date(startDate);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - days);

    const previousPeriodUsers = await prisma.user.count({
      where: { 
        createdAt: { 
          gte: previousPeriodStart, 
          lt: startDate 
        } 
      }
    });

    const growthRate = previousPeriodUsers > 0 
      ? ((newUsers - previousPeriodUsers) / previousPeriodUsers) * 100 
      : 0;

    return {
      period: { days, startDate, endDate: new Date() },
      users: {
        total: totalUsers,
        new: newUsers,
        active: activeUserCount,
        activeRate: totalUsers > 0 ? (activeUserCount / totalUsers) * 100 : 0,
        growthRate
      },
      subscriptions: subscriptions.reduce((acc, sub) => {
        acc[sub.plan] = sub._count.plan;
        return acc;
      }, {}),
      usage: {
        imagesGenerated: usageTotals._sum.imagesGenerated || 0,
        postsPublished: usageTotals._sum.postsPublished || 0,
        chatMessages: usageTotals._sum.chatMessages || 0,
        apiCalls: usageTotals._sum.apiCalls || 0
      },
      topModels
    };
  } catch (error) {
    console.error('[Analytics] Get platform analytics error:', error);
    throw error;
  }
}

/**
 * Track performance metrics
 */
export async function trackPerformance(metric, value, userId = null) {
  try {
    // This could be extended to use a time-series database like InfluxDB
    // For now, we'll use a simple logging approach
    const timestamp = new Date().toISOString();
    console.log(`[Performance] ${timestamp} - ${metric}: ${value}${userId ? ` (user: ${userId})` : ''}`);
    
    // Store in database for critical metrics
    if (['api_response_time', 'image_generation_time', 'error_rate'].includes(metric)) {
      // Could create a PerformanceMetric model for this
      console.log(`[Performance] Storing critical metric: ${metric} = ${value}`);
    }
  } catch (error) {
    console.error('[Analytics] Track performance error:', error);
  }
}

/**
 * Get real-time statistics
 */
export async function getRealTimeStats() {
  try {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const lastHour = new Date(now.getTime() - 60 * 60 * 1000);

    const [
      activeUsers24h,
      imagesGenerated24h,
      postsPublished24h,
      activeUsersLastHour
    ] = await Promise.all([
      // Active users in last 24h
      prisma.usageStats.groupBy({
        by: ['userId'],
        where: { date: { gte: last24Hours } }
      }),
      
      // Images generated in last 24h
      prisma.usageStats.aggregate({
        where: { date: { gte: last24Hours } },
        _sum: { imagesGenerated: true }
      }),
      
      // Posts published in last 24h
      prisma.usageStats.aggregate({
        where: { date: { gte: last24Hours } },
        _sum: { postsPublished: true }
      }),
      
      // Active users in last hour (approximate using chat activity)
      prisma.chatMessage.groupBy({
        by: ['userId'],
        where: { timestamp: { gte: lastHour } }
      })
    ]);

    return {
      timestamp: now,
      activeUsers: {
        last24Hours: activeUsers24h.length,
        lastHour: activeUsersLastHour.length
      },
      activity: {
        imagesGenerated24h: imagesGenerated24h._sum.imagesGenerated || 0,
        postsPublished24h: postsPublished24h._sum.postsPublished || 0
      }
    };
  } catch (error) {
    console.error('[Analytics] Get real-time stats error:', error);
    throw error;
  }
}
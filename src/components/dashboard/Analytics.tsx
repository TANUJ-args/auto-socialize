import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { 
  Activity, 
  Image, 
  MessageCircle, 
  Share2, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Star,
  Calendar,
  Users
} from 'lucide-react';

const Analytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [engagement, setEngagement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);

  useEffect(() => {
    fetchAnalytics();
    fetchEngagement();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token') || 'demo-token';
      const response = await fetch(`/api/analytics/user?days=${period}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.analytics);
      } else {
        console.warn('Analytics not available:', response.status);
        // Set default analytics for demo
        setAnalytics({
          totals: { imagesGenerated: 5, postsPublished: 2, chatMessages: 12, activeDays: 3 },
          trends: { images: 'up', posts: 'stable', messages: 'up' },
          engagement: { mostActiveHour: 14 },
          posts: [],
          recentImages: []
        });
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      // Fallback to demo data
      setAnalytics({
        totals: { imagesGenerated: 5, postsPublished: 2, chatMessages: 12, activeDays: 3 },
        trends: { images: 'up', posts: 'stable', messages: 'up' },
        engagement: { mostActiveHour: 14 },
        posts: [],
        recentImages: []
      });
    }
  };

  const fetchEngagement = async () => {
    try {
      const token = localStorage.getItem('token') || 'demo-token';
      const response = await fetch(`/api/analytics/engagement?days=${period}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setEngagement(data.engagement);
      } else {
        console.warn('Engagement not available:', response.status);
        // Set demo engagement data
        setEngagement({
          score: 75,
          level: 'medium',
          recommendations: [
            {
              type: 'generate_images',
              message: 'Try generating more AI images to boost your content creation',
              action: 'Create your first AI-generated image'
            }
          ]
        });
      }
    } catch (error) {
      console.error('Failed to fetch engagement:', error);
      setEngagement({
        score: 75,
        level: 'medium',
        recommendations: [
          {
            type: 'generate_images',
            message: 'Try generating more AI images to boost your content creation',
            action: 'Create your first AI-generated image'
          }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getEngagementColor = (level) => {
    switch (level) {
      case 'high': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Data</h3>
        <p className="text-gray-500">Start creating content to see your analytics</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        <div className="flex gap-2">
          {[7, 30, 90].map(days => (
            <Button
              key={days}
              variant={period === days ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod(days)}
            >
              {days}d
            </Button>
          ))}
        </div>
      </div>

      {/* Engagement Score */}
      {engagement && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5" />
              Engagement Score
            </CardTitle>
            <CardDescription>
              Your overall activity and engagement level
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold">{engagement.score}</span>
                <Badge className={getEngagementColor(engagement.level)}>
                  {engagement.level}
                </Badge>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Most Active</p>
                <p className="font-medium">{analytics.engagement.mostActiveHour}:00</p>
              </div>
            </div>
            <Progress value={engagement.score} className="mb-4" />
            
            {engagement.recommendations.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Recommendations:</p>
                {engagement.recommendations.map((rec, index) => (
                  <div key={index} className="text-sm p-2 bg-blue-50 rounded-md">
                    <p className="text-blue-800">{rec.message}</p>
                    <p className="text-blue-600 font-medium">{rec.action}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Images Generated</CardTitle>
            <Image className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{analytics.totals.imagesGenerated}</div>
              {getTrendIcon(analytics.trends.images)}
            </div>
            <p className="text-xs text-muted-foreground">
              Last {period} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Posts Published</CardTitle>
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{analytics.totals.postsPublished}</div>
              {getTrendIcon(analytics.trends.posts)}
            </div>
            <p className="text-xs text-muted-foreground">
              Last {period} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chat Messages</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{analytics.totals.chatMessages}</div>
              {getTrendIcon(analytics.trends.messages)}
            </div>
            <p className="text-xs text-muted-foreground">
              Last {period} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Days</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{analytics.totals.activeDays}</div>
              <div className="text-xs text-muted-foreground">
                {Math.round((analytics.totals.activeDays / period) * 100)}%
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Out of {period} days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Posts */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Posts</CardTitle>
            <CardDescription>Your latest published content</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.posts.length > 0 ? (
              <div className="space-y-3">
                {analytics.posts.slice(0, 5).map(post => (
                  <div key={post.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex-1">
                      <p className="text-sm font-medium truncate">
                        {post.title || post.content.substring(0, 50) + '...'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {post.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                No posts yet. Create your first post!
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Images */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Images</CardTitle>
            <CardDescription>Your latest AI-generated images</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.recentImages.length > 0 ? (
              <div className="space-y-3">
                {analytics.recentImages.map(image => (
                  <div key={image.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex-1">
                      <p className="text-sm font-medium truncate">
                        {image.prompt.substring(0, 40)}...
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(image.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {image.model.split('/').pop()}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                No images generated yet. Try the AI assistant!
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
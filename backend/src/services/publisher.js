import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

const publishToInstagram = async (post, account) => {
  try {
    // Only publish image posts for now
    if (post.postType !== 'image') {
      return { success: false, error: 'Only image posts supported' };
    }
    
    // Step 1: Create media container
    const containerResponse = await axios.post(
      `https://graph.facebook.com/v18.0/${account.accountId}/media`,
      {
        image_url: post.mediaUrl,
        caption: post.content,
        access_token: account.accessToken
      }
    );
    
    const mediaId = containerResponse.data.id;
    
    // Step 2: Publish the media
    const publishResponse = await axios.post(
      `https://graph.facebook.com/v18.0/${account.accountId}/media_publish`,
      {
        creation_id: mediaId,
        access_token: account.accessToken
      }
    );
    
    return {
      success: true,
      postId: publishResponse.data.id,
      publishedAt: new Date()
    };
  } catch (error) {
    console.error('Instagram publish error:', error);
    return {
      success: false,
      error: error.response?.data?.error?.message || 'Failed to publish'
    };
  }
};

const publishToTwitter = async (post, account) => {
  // Twitter is "Coming Soon"
  return {
    success: false,
    error: 'Twitter publishing coming soon'
  };
};

const publishToLinkedIn = async (post, account) => {
  // LinkedIn is "Coming Soon"
  return {
    success: false,
    error: 'LinkedIn publishing coming soon'
  };
};

const publishPosts = async (prismaClient = prisma) => {
  try {
    // Find posts ready to publish
    const posts = await prismaClient.post.findMany({
      where: {
        status: 'scheduled',
        scheduledDate: {
          lte: new Date()
        }
      },
      include: {
        user: {
          include: {
            socialAccounts: {
              where: {
                isActive: true
              }
            }
          }
        }
      }
    });
    
    console.log(`Found ${posts.length} posts to publish`);
    
    for (const post of posts) {
      const results = {};
      let hasSuccess = false;
      let hasFailure = false;
      
      for (const platform of post.platforms) {
        const account = post.user.socialAccounts.find(
          acc => acc.platform === platform
        );
        
        if (!account) {
          results[platform] = {
            success: false,
            error: 'Account not connected'
          };
          hasFailure = true;
          continue;
        }
        
        let result;
        switch (platform) {
          case 'instagram':
            result = await publishToInstagram(post, account);
            break;
          case 'twitter':
            result = await publishToTwitter(post, account);
            break;
          case 'linkedin':
            result = await publishToLinkedIn(post, account);
            break;
          default:
            result = { success: false, error: 'Unknown platform' };
        }
        
        results[platform] = result;
        if (result.success) hasSuccess = true;
        else hasFailure = true;
      }
      
      // Update post status and results
      await prismaClient.post.update({
        where: { id: post.id },
        data: {
          status: hasFailure && !hasSuccess ? 'failed' : 'published',
          publishResults: results
        }
      });
      
      console.log(`Post ${post.id} processed:`, results);
    }
  } catch (error) {
    console.error('Publisher error:', error);
  }
};

export default publishPosts;
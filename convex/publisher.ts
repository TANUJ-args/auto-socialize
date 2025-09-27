import { v } from "convex/values";
import { internalMutation, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

export const publishScheduledPosts = internalAction({
  handler: async (ctx) => {
    const now = Date.now();
    
    // Get all scheduled posts that are due
    const posts = await ctx.runQuery(internal.publisher.getPostsToPublish, { now });
    
    for (const post of posts) {
      // Get user's social accounts
      const accounts = await ctx.runQuery(internal.publisher.getUserAccounts, { userId: post.userId });
      
      const publishResults: any = {};
      let allSuccess = true;
      
      for (const platform of post.platforms) {
        const account = accounts.find(a => a.platform === platform);
        
        if (!account || !account.isActive) {
          publishResults[platform] = {
            success: false,
            error: "Account not connected or inactive",
            publishedAt: now,
          };
          allSuccess = false;
          continue;
        }
        
        // Publish to platform
        if (platform === "instagram" && post.postType === "image" && post.mediaUrl) {
          try {
            // Instagram Graph API publishing
            const response = await fetch(
              `https://graph.instagram.com/${account.accountId}/media`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  image_url: post.mediaUrl,
                  caption: post.platformSpecificContent?.instagram || post.content,
                  access_token: account.accessToken,
                }),
              }
            );
            
            if (response.ok) {
              const data = await response.json();
              
              // Publish the media
              const publishResponse = await fetch(
                `https://graph.instagram.com/${account.accountId}/media_publish`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    creation_id: data.id,
                    access_token: account.accessToken,
                  }),
                }
              );
              
              if (publishResponse.ok) {
                const publishData = await publishResponse.json();
                publishResults[platform] = {
                  success: true,
                  postId: publishData.id,
                  publishedAt: now,
                };
              } else {
                const error = await publishResponse.json();
                publishResults[platform] = {
                  success: false,
                  error: error.error?.message || "Failed to publish",
                  publishedAt: now,
                };
                allSuccess = false;
              }
            } else {
              const error = await response.json();
              publishResults[platform] = {
                success: false,
                error: error.error?.message || "Failed to create media",
                publishedAt: now,
              };
              allSuccess = false;
            }
          } catch (error) {
            publishResults[platform] = {
              success: false,
              error: error instanceof Error ? error.message : "Unknown error",
              publishedAt: now,
            };
            allSuccess = false;
          }
        } else if (platform === "twitter" || platform === "linkedin") {
          // Twitter and LinkedIn are coming soon
          publishResults[platform] = {
            success: false,
            error: "Coming Soon",
            publishedAt: now,
          };
          allSuccess = false;
        } else {
          publishResults[platform] = {
            success: false,
            error: "Unsupported post type for this platform",
            publishedAt: now,
          };
          allSuccess = false;
        }
      }
      
      // Update post status
      await ctx.runMutation(internal.publisher.updatePostStatus, {
        postId: post._id,
        status: allSuccess ? "published" : "failed",
        publishResults,
      });
    }
  },
});

export const getPostsToPublish = internalMutation({
  args: {
    now: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("posts")
      .withIndex("by_status_and_scheduled_date", (q) => 
        q.eq("status", "scheduled").lte("scheduledDate", args.now)
      )
      .collect();
  },
});

export const getUserAccounts = internalMutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("socialAccounts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const updatePostStatus = internalMutation({
  args: {
    postId: v.id("posts"),
    status: v.union(v.literal("published"), v.literal("failed")),
    publishResults: v.any(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.postId, {
      status: args.status,
      publishResults: args.publishResults,
    });
  },
});
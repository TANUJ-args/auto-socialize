import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";

export const list = query({
  handler: async (ctx) => {
    const userId = await ctx.auth.getUserId();
    if (!userId) return [];

    return await ctx.db
      .query("socialAccounts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const getByPlatform = query({
  args: {
    platform: v.union(v.literal("instagram"), v.literal("twitter"), v.literal("linkedin")),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserId();
    if (!userId) return null;

    const accounts = await ctx.db
      .query("socialAccounts")
      .withIndex("by_user_and_platform", (q) => 
        q.eq("userId", userId).eq("platform", args.platform)
      )
      .first();

    return accounts;
  },
});

export const saveInstagramAccount = mutation({
  args: {
    accountId: v.string(),
    username: v.string(),
    displayName: v.optional(v.string()),
    profileImage: v.optional(v.string()),
    accessToken: v.string(),
    tokenExpiry: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserId();
    if (!userId) throw new Error("Not authenticated");

    // Check if account already exists
    const existing = await ctx.db
      .query("socialAccounts")
      .withIndex("by_user_and_platform", (q) => 
        q.eq("userId", userId).eq("platform", "instagram")
      )
      .first();

    if (existing) {
      // Update existing account
      await ctx.db.patch(existing._id, {
        accountId: args.accountId,
        username: args.username,
        displayName: args.displayName,
        profileImage: args.profileImage,
        accessToken: args.accessToken,
        tokenExpiry: args.tokenExpiry,
        isActive: true,
      });
      return existing._id;
    }

    // Create new account
    return await ctx.db.insert("socialAccounts", {
      userId,
      platform: "instagram",
      ...args,
      isActive: true,
    });
  },
});

export const disconnect = mutation({
  args: {
    platform: v.union(v.literal("instagram"), v.literal("twitter"), v.literal("linkedin")),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserId();
    if (!userId) throw new Error("Not authenticated");

    const account = await ctx.db
      .query("socialAccounts")
      .withIndex("by_user_and_platform", (q) => 
        q.eq("userId", userId).eq("platform", args.platform)
      )
      .first();

    if (account) {
      await ctx.db.delete(account._id);
    }
  },
});

export const verifyInstagramAccount = action({
  handler: async (ctx) => {
    const userId = await ctx.auth.getUserId();
    if (!userId) throw new Error("Not authenticated");

    const account = await ctx.runQuery(api.socialAccounts.getByPlatform, { platform: "instagram" });
    if (!account) {
      return { success: false, error: "No Instagram account connected" };
    }

    try {
      // Verify token with Instagram API
      const response = await fetch(
        `https://graph.instagram.com/me?fields=id,username&access_token=${account.accessToken}`
      );

      if (!response.ok) {
        const error = await response.json();
        return { 
          success: false, 
          error: `Instagram API Error: ${error.error?.message || 'Token validation failed'}` 
        };
      }

      const data = await response.json();
      return { 
        success: true, 
        username: data.username,
        accountId: data.id 
      };
    } catch (error) {
      return { 
        success: false, 
        error: `Failed to verify account: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  },
});
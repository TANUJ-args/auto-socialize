import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    title: v.optional(v.string()),
    content: v.string(),
    postType: v.union(v.literal("text"), v.literal("image"), v.literal("video")),
    mediaUrl: v.optional(v.string()),
    scheduledDate: v.optional(v.number()),
    status: v.union(v.literal("draft"), v.literal("scheduled")),
    platforms: v.array(v.union(v.literal("instagram"), v.literal("twitter"), v.literal("linkedin"))),
    platformSpecificContent: v.optional(v.object({
      instagram: v.optional(v.string()),
      twitter: v.optional(v.string()),
      linkedin: v.optional(v.string()),
    })),
    aiGenerated: v.boolean(),
    prompt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserId();
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("posts", {
      userId,
      ...args,
      publishResults: undefined,
    });
  },
});

export const list = query({
  args: {
    status: v.optional(v.union(v.literal("draft"), v.literal("scheduled"), v.literal("published"), v.literal("failed"))),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserId();
    if (!userId) return [];

    if (args.status) {
      return await ctx.db
        .query("posts")
        .withIndex("by_user_and_status", (q) => q.eq("userId", userId).eq("status", args.status!))
        .order("desc")
        .collect();
    }

    return await ctx.db
      .query("posts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const update = mutation({
  args: {
    id: v.id("posts"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    postType: v.optional(v.union(v.literal("text"), v.literal("image"), v.literal("video"))),
    mediaUrl: v.optional(v.string()),
    scheduledDate: v.optional(v.number()),
    status: v.optional(v.union(v.literal("draft"), v.literal("scheduled"))),
    platforms: v.optional(v.array(v.union(v.literal("instagram"), v.literal("twitter"), v.literal("linkedin")))),
    platformSpecificContent: v.optional(v.object({
      instagram: v.optional(v.string()),
      twitter: v.optional(v.string()),
      linkedin: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserId();
    if (!userId) throw new Error("Not authenticated");

    const { id, ...updates } = args;
    const post = await ctx.db.get(id);
    if (!post || post.userId !== userId) {
      throw new Error("Post not found or unauthorized");
    }

    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: {
    id: v.id("posts"),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserId();
    if (!userId) throw new Error("Not authenticated");

    const post = await ctx.db.get(args.id);
    if (!post || post.userId !== userId) {
      throw new Error("Post not found or unauthorized");
    }

    await ctx.db.delete(args.id);
  },
});

export const getScheduledPosts = query({
  handler: async (ctx) => {
    const userId = await ctx.auth.getUserId();
    if (!userId) return [];

    return await ctx.db
      .query("posts")
      .withIndex("by_user_and_status", (q) => q.eq("userId", userId).eq("status", "scheduled"))
      .order("asc")
      .collect();
  },
});
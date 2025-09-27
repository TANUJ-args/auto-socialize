import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.optional(v.string()),
    emailVerified: v.optional(v.boolean()),
    isAnonymous: v.optional(v.boolean()),
    createdAt: v.number(),
  }),

  socialAccounts: defineTable({
    userId: v.id("users"),
    platform: v.union(v.literal("instagram"), v.literal("twitter"), v.literal("linkedin")),
    accountId: v.string(),
    username: v.string(),
    displayName: v.optional(v.string()),
    profileImage: v.optional(v.string()),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    tokenExpiry: v.optional(v.number()),
    isActive: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_platform", ["userId", "platform"]),

  posts: defineTable({
    userId: v.id("users"),
    title: v.optional(v.string()),
    content: v.string(),
    postType: v.union(v.literal("text"), v.literal("image"), v.literal("video")),
    mediaUrl: v.optional(v.string()),
    mediaId: v.optional(v.string()),
    scheduledDate: v.optional(v.number()),
    status: v.union(v.literal("draft"), v.literal("scheduled"), v.literal("published"), v.literal("failed")),
    platforms: v.array(v.union(v.literal("instagram"), v.literal("twitter"), v.literal("linkedin"))),
    platformSpecificContent: v.optional(v.object({
      instagram: v.optional(v.string()),
      twitter: v.optional(v.string()),
      linkedin: v.optional(v.string()),
    })),
    aiGenerated: v.boolean(),
    prompt: v.optional(v.string()),
    publishResults: v.optional(v.object({
      instagram: v.optional(v.object({
        success: v.boolean(),
        postId: v.optional(v.string()),
        error: v.optional(v.string()),
        publishedAt: v.optional(v.number()),
      })),
      twitter: v.optional(v.object({
        success: v.boolean(),
        postId: v.optional(v.string()),
        error: v.optional(v.string()),
        publishedAt: v.optional(v.number()),
      })),
      linkedin: v.optional(v.object({
        success: v.boolean(),
        postId: v.optional(v.string()),
        error: v.optional(v.string()),
        publishedAt: v.optional(v.number()),
      })),
    })),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_status", ["userId", "status"])
    .index("by_scheduled_date", ["scheduledDate"])
    .index("by_status_and_scheduled_date", ["status", "scheduledDate"]),

  chatSessions: defineTable({
    userId: v.id("users"),
    title: v.optional(v.string()),
    isActive: v.boolean(),
  })
    .index("by_user", ["userId"]),

  chatMessages: defineTable({
    sessionId: v.id("chatSessions"),
    userId: v.id("users"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    timestamp: v.number(),
  })
    .index("by_session", ["sessionId"])
    .index("by_session_and_timestamp", ["sessionId", "timestamp"]),
});
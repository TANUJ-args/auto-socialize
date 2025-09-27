import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";
import OpenAI from "openai";

export const createSession = mutation({
  args: {
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserId();
    if (!userId) throw new Error("Not authenticated");

    // Deactivate other sessions
    const activeSessions = await ctx.db
      .query("chatSessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    for (const session of activeSessions) {
      await ctx.db.patch(session._id, { isActive: false });
    }

    // Create new session
    return await ctx.db.insert("chatSessions", {
      userId,
      title: args.title || "New Chat",
      isActive: true,
    });
  },
});

export const getSessions = query({
  handler: async (ctx) => {
    const userId = await ctx.auth.getUserId();
    if (!userId) return [];

    return await ctx.db
      .query("chatSessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const getActiveSession = query({
  handler: async (ctx) => {
    const userId = await ctx.auth.getUserId();
    if (!userId) return null;

    return await ctx.db
      .query("chatSessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();
  },
});

export const getMessages = query({
  args: {
    sessionId: v.id("chatSessions"),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserId();
    if (!userId) return [];

    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== userId) return [];

    return await ctx.db
      .query("chatMessages")
      .withIndex("by_session_and_timestamp", (q) => q.eq("sessionId", args.sessionId))
      .order("asc")
      .collect();
  },
});

export const addMessage = mutation({
  args: {
    sessionId: v.id("chatSessions"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserId();
    if (!userId) throw new Error("Not authenticated");

    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== userId) {
      throw new Error("Session not found or unauthorized");
    }

    return await ctx.db.insert("chatMessages", {
      sessionId: args.sessionId,
      userId,
      role: args.role,
      content: args.content,
      timestamp: Date.now(),
    });
  },
});

export const generateResponse = action({
  args: {
    sessionId: v.id("chatSessions"),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserId();
    if (!userId) throw new Error("Not authenticated");

    // Add user message
    await ctx.runMutation(api.chat.addMessage, {
      sessionId: args.sessionId,
      role: "user",
      content: args.message,
    });

    try {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error("OpenAI API key not configured");
      }

      // Initialize OpenAI
      const openai = new OpenAI({
        apiKey: apiKey,
      });

      // Get chat history
      const messages = await ctx.runQuery(api.chat.getMessages, { sessionId: args.sessionId });
      
      // Build conversation messages
      const openaiMessages = [
        {
          role: "system" as const,
          content: "You are a helpful social media assistant. Help users create engaging content for Instagram, Twitter, and LinkedIn. Provide creative suggestions, hashtags, and optimize content for each platform."
        },
        ...messages.slice(0, -1).map(msg => ({
          role: msg.role === "user" ? "user" as const : "assistant" as const,
          content: msg.content,
        })),
        {
          role: "user" as const,
          content: args.message
        }
      ];

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: openaiMessages,
        temperature: 0.7,
        max_tokens: 2048,
      });

      const text = completion.choices[0].message.content;

      // Add assistant message
      await ctx.runMutation(api.chat.addMessage, {
        sessionId: args.sessionId,
        role: "assistant",
        content: text,
      });

      return { success: true, response: text };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to generate response";
      
      // Add error message
      await ctx.runMutation(api.chat.addMessage, {
        sessionId: args.sessionId,
        role: "assistant",
        content: `Error: ${errorMessage}. Please try again.`,
      });

      return { success: false, error: errorMessage };
    }
  },
});
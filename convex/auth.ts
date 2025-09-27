import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { Anonymous } from "@convex-dev/auth/providers/Anonymous";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [
    Password({
      id: "email-otp",
      verify: {
        codeLength: 6,
      },
    }),
    Anonymous(),
  ],
  callbacks: {
    async createOrUpdateUser(ctx, args) {
      const { userId, profile } = args;
      
      if (userId) {
        // Update existing user
        await ctx.db.patch(userId, {
          emailVerified: true,
        });
        return userId;
      }
      
      // Create new user
      return await ctx.db.insert("users", {
        email: profile?.email as string | undefined,
        emailVerified: profile?.email ? true : false,
        isAnonymous: !profile?.email,
        createdAt: Date.now(),
      });
    },
  },
});
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

// Instagram OAuth start
http.route({
  path: "/api/instagram/oauth/start",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const userId = await ctx.auth.getUserId();
    if (!userId) {
      return new Response("Not authenticated", { status: 401 });
    }

    const appId = process.env.FACEBOOK_APP_ID;
    const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;
    
    if (!appId || !redirectUri) {
      return new Response("Instagram OAuth not configured", { status: 500 });
    }

    // Generate secure state with HMAC
    const stateData = {
      userId,
      timestamp: Date.now(),
      nonce: Math.random().toString(36).substring(7),
    };
    
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(stateData));
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const state = btoa(JSON.stringify(stateData)) + '.' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Instagram OAuth URL
    const oauthUrl = new URL("https://www.facebook.com/v18.0/dialog/oauth");
    oauthUrl.searchParams.append("client_id", appId);
    oauthUrl.searchParams.append("redirect_uri", redirectUri);
    oauthUrl.searchParams.append("scope", "instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement,instagram_manage_insights");
    oauthUrl.searchParams.append("response_type", "code");
    oauthUrl.searchParams.append("state", state);

    return Response.redirect(oauthUrl.toString());
  }),
});

// Instagram OAuth callback
http.route({
  path: "/api/instagram/oauth/callback",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");
    const errorDescription = url.searchParams.get("error_description");

    if (error) {
      return new Response(`
        <html>
          <body>
            <script>
              window.opener.postMessage({ 
                type: 'instagram-oauth-error', 
                error: '${error}', 
                description: '${errorDescription}' 
              }, '*');
              window.close();
            </script>
          </body>
        </html>
      `, {
        headers: { "Content-Type": "text/html" },
      });
    }

    if (!code || !state) {
      return new Response("Missing code or state", { status: 400 });
    }

    // Verify state
    try {
      const [stateData, hash] = state.split('.');
      const decoded = JSON.parse(atob(stateData));
      
      // Verify timestamp (within 10 minutes)
      if (Date.now() - decoded.timestamp > 10 * 60 * 1000) {
        throw new Error("State expired");
      }
    } catch {
      return new Response("Invalid state", { status: 400 });
    }

    const appId = process.env.FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;
    const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;

    if (!appId || !appSecret || !redirectUri) {
      return new Response("Instagram OAuth not configured", { status: 500 });
    }

    try {
      // Exchange code for short-lived token
      const tokenResponse = await fetch(
        `https://graph.facebook.com/v18.0/oauth/access_token?` +
        `client_id=${appId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `client_secret=${appSecret}&` +
        `code=${code}`
      );

      if (!tokenResponse.ok) {
        throw new Error("Failed to exchange code for token");
      }

      const tokenData = await tokenResponse.json();
      const shortLivedToken = tokenData.access_token;

      // Exchange for long-lived token
      const longLivedResponse = await fetch(
        `https://graph.facebook.com/v18.0/oauth/access_token?` +
        `grant_type=fb_exchange_token&` +
        `client_id=${appId}&` +
        `client_secret=${appSecret}&` +
        `fb_exchange_token=${shortLivedToken}`
      );

      if (!longLivedResponse.ok) {
        throw new Error("Failed to get long-lived token");
      }

      const longLivedData = await longLivedResponse.json();
      const longLivedToken = longLivedData.access_token;
      const expiresIn = longLivedData.expires_in || 5184000; // 60 days default

      // Get Facebook pages
      const pagesResponse = await fetch(
        `https://graph.facebook.com/v18.0/me/accounts?access_token=${longLivedToken}`
      );

      if (!pagesResponse.ok) {
        throw new Error("Failed to get Facebook pages");
      }

      const pagesData = await pagesResponse.json();
      const pages = pagesData.data || [];

      // Find Instagram Business Account
      let instagramAccount = null;
      for (const page of pages) {
        const igResponse = await fetch(
          `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`
        );

        if (igResponse.ok) {
          const igData = await igResponse.json();
          if (igData.instagram_business_account) {
            // Get Instagram account details
            const accountResponse = await fetch(
              `https://graph.facebook.com/v18.0/${igData.instagram_business_account.id}?fields=id,username,name,profile_picture_url&access_token=${page.access_token}`
            );

            if (accountResponse.ok) {
              const accountData = await accountResponse.json();
              instagramAccount = {
                ...accountData,
                access_token: page.access_token,
              };
              break;
            }
          }
        }
      }

      if (!instagramAccount) {
        throw new Error("No Instagram Business Account found. Please ensure your Instagram account is connected to a Facebook Page and converted to a Business account.");
      }

      // Save to database
      await ctx.runMutation(api.socialAccounts.saveInstagramAccount, {
        accountId: instagramAccount.id,
        username: instagramAccount.username,
        displayName: instagramAccount.name,
        profileImage: instagramAccount.profile_picture_url,
        accessToken: instagramAccount.access_token,
        tokenExpiry: Date.now() + (expiresIn * 1000),
      });

      return new Response(`
        <html>
          <body>
            <script>
              window.opener.postMessage({ 
                type: 'instagram-oauth-success',
                username: '${instagramAccount.username}'
              }, '*');
              window.close();
            </script>
          </body>
        </html>
      `, {
        headers: { "Content-Type": "text/html" },
      });
    } catch (error) {
      return new Response(`
        <html>
          <body>
            <script>
              window.opener.postMessage({ 
                type: 'instagram-oauth-error', 
                error: '${error instanceof Error ? error.message : 'Unknown error'}'
              }, '*');
              window.close();
            </script>
          </body>
        </html>
      `, {
        headers: { "Content-Type": "text/html" },
      });
    }
  }),
});

export default http;
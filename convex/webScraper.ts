import { action } from "./_generated/server";
import { v } from "convex/values";

export const scrapeUrl = action({
  args: {
    url: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const response = await fetch(args.url);
      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.status}`);
      }

      const html = await response.text();
      
      // Extract title
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : "";

      // Extract meta description
      const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
      const description = descMatch ? descMatch[1].trim() : "";

      // Extract Open Graph data
      const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)?.[1] || "";
      const ogDescription = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i)?.[1] || "";
      const ogImage = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)?.[1] || "";
      const ogUrl = html.match(/<meta[^>]*property=["']og:url["'][^>]*content=["']([^"']+)["']/i)?.[1] || "";

      // Extract links (max 20)
      const linkMatches = html.matchAll(/<a[^>]*href=["']([^"']+)["'][^>]*>([^<]*)</gi);
      const links = [];
      let count = 0;
      for (const match of linkMatches) {
        if (count >= 20) break;
        const href = match[1];
        const text = match[2].trim();
        if (href && !href.startsWith("#") && !href.startsWith("javascript:")) {
          links.push({
            href: href.startsWith("http") ? href : new URL(href, args.url).toString(),
            text: text || "No text",
          });
          count++;
        }
      }

      return {
        success: true,
        data: {
          title,
          description,
          openGraph: {
            title: ogTitle,
            description: ogDescription,
            image: ogImage,
            url: ogUrl,
          },
          links,
          scrapedAt: Date.now(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to scrape URL",
      };
    }
  },
});
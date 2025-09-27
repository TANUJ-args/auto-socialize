// Simple in-memory rate limiter (per IP) to avoid dependency bloat.
// Not production grade (no cluster support). For real deployments, replace with Redis or a dedicated rate-limit service.

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 30; // per window per IP

const buckets = new Map(); // ip -> { count, windowStart }

export function rateLimit(req, res, next) {
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  const now = Date.now();
  const bucket = buckets.get(ip) || { count: 0, windowStart: now };
  if (now - bucket.windowStart > WINDOW_MS) {
    bucket.count = 0;
    bucket.windowStart = now;
  }
  bucket.count += 1;
  buckets.set(ip, bucket);
  if (bucket.count > MAX_REQUESTS) {
    return res.status(429).json({ error: 'Rate limit exceeded. Try again later.' });
  }
  res.setHeader('X-RateLimit-Limit', MAX_REQUESTS);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, MAX_REQUESTS - bucket.count));
  next();
}

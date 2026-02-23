import { redis } from "./redis";

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

export async function rateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const now = Math.floor(Date.now() / 1000);
  const windowKey = `rl:${key}:${Math.floor(now / windowSeconds)}`;

  const count = await redis.incr(windowKey);
  if (count === 1) {
    await redis.expire(windowKey, windowSeconds);
  }

  const remaining = Math.max(0, maxRequests - count);
  const resetAt = new Date(
    (Math.floor(now / windowSeconds) + 1) * windowSeconds * 1000
  );

  return {
    allowed: count <= maxRequests,
    remaining,
    resetAt,
  };
}

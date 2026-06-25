/* eslint-disable @typescript-eslint/no-explicit-any */
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

// Initialize Upstash Redis instance
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = (redisUrl && redisToken)
  ? new Redis({ url: redisUrl, token: redisToken })
  : null;

// Helper to construct a dummy limiter if Redis is unconfigured
const createLimiter = (limit: number, window: string, prefix: string) => {
  if (!redis) {
    return {
      limit: async () => ({ success: true, limit, remaining: limit, reset: Date.now() })
    } as any;
  }
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, window as any),
    prefix,
  });
};

export const rateLimiters = {
  webhook: createLimiter(60, "1 m", "wapi:webhook"),
  auth: createLimiter(5, "15 m", "wapi:auth"),
  documents: createLimiter(10, "1 h", "wapi:documents"),
  conversations: createLimiter(120, "1 m", "wapi:conversations"),
  reply: createLimiter(30, "1 m", "wapi:reply"),
  nudge: createLimiter(5, "1 h", "wapi:nudge"),
};

export async function applyRateLimit(limiter: any, identifier: string) {
  try {
    const { success, limit, remaining, reset } = await limiter.limit(identifier);
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
          },
        }
      );
    }
  } catch (err) {
    console.error("Rate limiter evaluation failed, bypassing limit:", err);
  }
  return null;
}

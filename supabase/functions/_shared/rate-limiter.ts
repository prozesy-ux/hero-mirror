// Enterprise Rate Limiter - Shared across edge functions
// Handles 10M+ daily traffic with intelligent rate limiting

// In-memory rate limit cache (per edge function instance)
const rateLimits = new Map<string, { count: number; resetAt: number }>();

// Clean up old entries periodically
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 60000; // 1 minute

function cleanupExpired() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  
  lastCleanup = now;
  for (const [key, value] of rateLimits.entries()) {
    if (value.resetAt < now) {
      rateLimits.delete(key);
    }
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

export interface RateLimitConfig {
  limit: number;      // Max requests per window
  windowMs: number;   // Window size in milliseconds
}

// Default rate limits for different endpoint types
export const RATE_LIMITS = {
  marketplace: { limit: 200, windowMs: 60000 },  // 200/min - public browsing
  search: { limit: 60, windowMs: 60000 },        // 60/min - search queries
  store: { limit: 100, windowMs: 60000 },        // 100/min - store pages
  api: { limit: 100, windowMs: 60000 },          // 100/min - general API
  auth: { limit: 10, windowMs: 60000 },          // 10/min - auth attempts
} as const;

/**
 * Check rate limit for an identifier (IP or user ID)
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = RATE_LIMITS.api
): RateLimitResult {
  cleanupExpired();
  
  const now = Date.now();
  const entry = rateLimits.get(identifier);
  
  // First request or window expired
  if (!entry || entry.resetAt < now) {
    rateLimits.set(identifier, { count: 1, resetAt: now + config.windowMs });
    return { 
      allowed: true, 
      remaining: config.limit - 1, 
      resetAt: now + config.windowMs 
    };
  }
  
  // Rate limit exceeded
  if (entry.count >= config.limit) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { 
      allowed: false, 
      remaining: 0, 
      resetAt: entry.resetAt,
      retryAfter,
    };
  }
  
  // Increment counter
  entry.count++;
  return { 
    allowed: true, 
    remaining: config.limit - entry.count, 
    resetAt: entry.resetAt 
  };
}

/**
 * Get client IP from request headers
 */
export function getClientIP(req: Request): string {
  return (
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-real-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    'unknown'
  );
}

/**
 * Create rate limit headers for response
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
  };
  
  if (!result.allowed && result.retryAfter) {
    headers['Retry-After'] = String(result.retryAfter);
  }
  
  return headers;
}

/**
 * Apply rate limiting to a request - returns error response if limited
 */
export function applyRateLimit(
  req: Request,
  corsHeaders: Record<string, string>,
  config: RateLimitConfig = RATE_LIMITS.api
): Response | null {
  const clientIP = getClientIP(req);
  const result = checkRateLimit(clientIP, config);
  
  if (!result.allowed) {
    return new Response(
      JSON.stringify({ 
        error: 'Rate limit exceeded',
        retryAfter: result.retryAfter,
      }),
      {
        status: 429,
        headers: {
          ...corsHeaders,
          ...rateLimitHeaders(result),
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      }
    );
  }
  
  return null; // Request allowed
}

import { Redis } from 'https://esm.sh/@upstash/redis@1.34.3';

let redis: Redis | null = null;

export function getRedis(): Redis | null {
  let url = Deno.env.get('UPSTASH_REDIS_REST_URL');
  const token = Deno.env.get('UPSTASH_REDIS_REST_TOKEN');
  
  if (!url || !token) {
    return null;
  }
  
  // Ensure URL starts with https://
  if (!url.startsWith('https://') && !url.startsWith('http://')) {
    url = `https://${url}`;
  }
  
  if (!redis) {
    try {
      redis = new Redis({ url, token });
    } catch (e) {
      console.error('[Redis] Failed to create client:', e);
      return null;
    }
  }
  return redis;
}

// Cache wrapper with automatic serialization
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const r = getRedis();
    if (!r) return null;
    
    const cached = await r.get(key);
    if (cached === null || cached === undefined) return null;
    // Upstash returns parsed JSON directly for objects
    if (typeof cached === 'object') return cached as T;
    if (typeof cached === 'string') {
      try {
        return JSON.parse(cached) as T;
      } catch {
        return cached as unknown as T;
      }
    }
    return cached as T;
  } catch (e) {
    console.error('[Redis] Get error:', e);
    return null;
  }
}

export async function cacheSet(key: string, data: unknown, ttlSeconds: number): Promise<void> {
  try {
    const r = getRedis();
    if (!r) return;
    
    await r.set(key, JSON.stringify(data), { ex: ttlSeconds });
  } catch (e) {
    console.error('[Redis] Set error:', e);
  }
}

export async function cacheDelete(pattern: string): Promise<void> {
  try {
    const r = getRedis();
    if (!r) return;
    
    // For pattern matching, we need to use SCAN
    if (pattern.includes('*')) {
      const keys = await r.keys(pattern);
      if (keys.length > 0) {
        await r.del(...keys);
        console.log(`[Redis] Deleted ${keys.length} keys matching ${pattern}`);
      }
    } else {
      await r.del(pattern);
    }
  } catch (e) {
    console.error('[Redis] Delete error:', e);
  }
}

// Check if Redis is configured
export function isRedisConfigured(): boolean {
  const url = Deno.env.get('UPSTASH_REDIS_REST_URL');
  const token = Deno.env.get('UPSTASH_REDIS_REST_TOKEN');
  return Boolean(url && token);
}

'use strict';

// Lightweight, dual backend cache: Redis (if available) or in-memory fallback.
let redisClient = null;
let useRedis = false;
const memoryCache = new Map();

async function initRedis() {
  if (redisClient || useRedis) return;
  try {
    const redis = require('redis');
    redisClient = redis.createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
    await redisClient.connect();
    useRedis = true;
    console.info('[Cache] Redis cache initialized');
  } catch (e) {
    useRedis = false;
    // Do not throw; we fallback to in-memory cache
  }
}

async function getCache() {
  if (!redisClient && !useRedis) {
    await initRedis();
  }
  return {
    async get(key) {
      if (useRedis && redisClient) {
        try {
          const raw = await redisClient.get(key);
          if (raw) return JSON.parse(raw);
        } catch (e) { /* ignore */ }
      }
      const entry = memoryCache.get(key);
      if (entry) {
        const { value, expires } = entry;
        if (Date.now() < expires) return value;
        memoryCache.delete(key);
      }
      return null;
    },
    async set(key, value, ttl) {
      const ttlMs = typeof ttl === 'number' ? ttl : 60000;
      if (useRedis && redisClient) {
        try {
          await redisClient.setEx(key, Math.ceil(ttlMs / 1000), JSON.stringify(value));
          return;
        } catch (e) {
          // Fallback to memory if Redis write fails
          useRedis = false;
        }
      }
      memoryCache.set(key, { value, expires: Date.now() + ttlMs });
    },
    async invalidate(key) {
      if (useRedis && redisClient) {
        try { await redisClient.del(key); } catch (e) {}
      }
      memoryCache.delete(key);
    },
    async clear() {
      if (useRedis && redisClient) {
        try { await redisClient.flushAll(); } catch (e) {}
      }
      memoryCache.clear();
    }
  };
}

module.exports = { getCache, initRedis };

import Redis from 'ioredis'
import { config } from '@/config'

let redisInstance: Redis | null = null

export function getRedis(): Redis {
  if (!redisInstance) {
    redisInstance = new Redis(config.redisUrl)
    redisInstance.on('error', (err) => {
      console.error('[Redis] connection error:', err.message)
    })
  }
  return redisInstance
}

export const redis = getRedis()

export async function getCache<T>(key: string): Promise<T | null> {
  const value = await getRedis().get(key)
  return value ? JSON.parse(value) : null
}

export async function setCache<T>(key: string, value: T, ttlSeconds = 3600): Promise<void> {
  await getRedis().setex(key, ttlSeconds, JSON.stringify(value))
}

export async function delCache(key: string): Promise<void> {
  await getRedis().del(key)
}

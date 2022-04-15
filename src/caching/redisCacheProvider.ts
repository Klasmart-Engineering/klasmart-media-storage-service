import { Redis } from 'ioredis'
import ICacheProvider from '../interfaces/cacheProvider'

export default class RedisCacheProvider implements ICacheProvider {
  constructor(private readonly redisClient: Redis) {}

  get(key: string): Promise<string | null> {
    return this.redisClient.get(key)
  }

  // nx: Only set the key if it does not already exist.
  // ex: Set the specified expire time, in seconds.
  // px: Set the specified expire time, in milliseconds.
  set(key: string, value: string, ttlSeconds: number): Promise<'OK' | null> {
    return this.redisClient.set(key, value, 'ex', ttlSeconds, 'nx')
  }
}

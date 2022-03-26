import { ICacheProvider } from '../interfaces/cacheProvider'

export default class MemoryCacheProvider implements ICacheProvider {
  constructor(
    private readonly clock: IClock,
    private readonly cache = new Map<string, MemoryCacheRecord>(),
  ) {}

  get(key: string): Promise<string | null> {
    const record = this.cache.get(key)
    if (record == null) {
      return Promise.resolve(null)
    }
    if (record.expirationMs && record.expirationMs < this.clock.now()) {
      this.cache.delete(key)
      return Promise.resolve(null)
    }
    return Promise.resolve(record.value)
  }

  set(key: string, value: string, ttlSeconds?: number): Promise<'OK' | null> {
    this.cache.set(key, {
      expirationMs: ttlSeconds
        ? this.clock.now() + ttlSeconds * 1000
        : undefined,
      value,
    })
    return Promise.resolve('OK')
  }

  prune() {
    for (const [key, record] of this.cache) {
      if (record.expirationMs && record.expirationMs < this.clock.now()) {
        this.cache.delete(key)
      }
    }
  }
}

export type MemoryCacheRecord = {
  value: string
  expirationMs?: number
}

export interface IClock {
  now(): number
}

export class DateClock implements IClock {
  now(): number {
    return Date.now()
  }
}

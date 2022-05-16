import { withLogger } from '@kl-engineering/kidsloop-nodejs-logger'
import { ApplicationError } from '../errors/applicationError'
import delay from '../helpers/delay'
import ICacheProvider from '../interfaces/cacheProvider'

const logger = withLogger('RaceConditionCacheProvider')

export class RaceConditionCacheProvider implements ICacheProvider {
  public static getLockKey(cacheKey: string) {
    return `Lock:${cacheKey}`
  }

  constructor(
    private readonly cache: ICacheProvider,
    private readonly maxAttempts = 20,
    private readonly dealyPerIteration = 100,
  ) {}

  public async get(key: string): Promise<string | null> {
    const result = await this.cache.get(key)
    if (result) {
      return result
    }
    const lockCacheKey = RaceConditionCacheProvider.getLockKey(key)
    const lockObtained = await this.cache.set(lockCacheKey, 'true', 5)
    if (!lockObtained) {
      return this.awaitResultFromOtherRequest(key)
    }
    return result
  }

  public set(
    key: string,
    value: string,
    ttlSeconds: number,
  ): Promise<'OK' | null> {
    return this.cache.set(key, value, ttlSeconds)
  }

  public delete(key: string): Promise<void> {
    return this.cache.delete(key)
  }

  private async awaitResultFromOtherRequest(cacheKey: string) {
    logger.debug(
      `[awaitResultFromOtherRequest] Another request is already in progress for the same arguments.` +
        `Now awaiting result from that request...`,
      { cacheKey },
    )
    let i = 0
    while (i < this.maxAttempts) {
      await delay(this.dealyPerIteration)
      const result = await this.cache.get(cacheKey)
      if (result) {
        return result
      }
      i += 1
      console.log(i)
    }
    throw new ApplicationError(
      `[awaitResultFromOtherRequest] Timed out waiting for the other request(s) to complete.`,
      undefined,
      { cacheKey },
    )
  }
}

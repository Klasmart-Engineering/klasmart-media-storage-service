import { withLogger } from 'kidsloop-nodejs-logger'
import { IAuthorizationProvider } from '../interfaces/authorizationProvider'
import { ICacheProvider } from '../interfaces/cacheProvider'

const logger = withLogger('CachedAuthorizationProvider')

export default class CachedAuthorizationProvider
  implements IAuthorizationProvider
{
  public static getCacheKey(endUserId: string, roomId: string) {
    return `isAuthorized|${endUserId}|${roomId}`
  }

  constructor(
    private readonly authorizationProvider: IAuthorizationProvider,
    private readonly cache: ICacheProvider,
    private readonly ttlSeconds = 24 * 60 * 60,
  ) {}

  public async isAuthorized(
    endUserId: string | undefined,
    roomId: string,
    authenticationToken: string | undefined,
  ): Promise<boolean> {
    if (!endUserId) {
      logger.debug(`[isAuthorized] endUserId is falsy`)
      return false
    }
    const key = CachedAuthorizationProvider.getCacheKey(endUserId, roomId)
    const cached = await this.cache.get(key)
    logger.silly(`[isAuthorized] cache.get(${key}): ${cached}`)
    let isAuthorized = cached === 'true' ? true : false

    if (cached == null) {
      isAuthorized = await this.authorizationProvider.isAuthorized(
        endUserId,
        roomId,
        authenticationToken,
      )
      await this.cache.set(key, String(isAuthorized), this.ttlSeconds)
    }

    return isAuthorized
  }
}

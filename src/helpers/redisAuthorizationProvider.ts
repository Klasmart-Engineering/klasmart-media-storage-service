import { Redis } from 'ioredis'
import { withLogger } from 'kidsloop-nodejs-logger'
import { IAuthorizationProvider } from '../interfaces/authorizationProvider'

const logger = withLogger('RedisAuthorizationProvider')

export default class RedisAuthorizationProvider
  implements IAuthorizationProvider
{
  constructor(
    private readonly authorizationProvider: IAuthorizationProvider,
    private readonly redisClient: Redis,
  ) {}

  public async isAuthorized(
    endUserId: string | undefined,
    roomId: string,
    authenticationToken: string | undefined,
  ): Promise<boolean> {
    const key = `${endUserId}|${roomId}`
    const cached = await this.redisClient.get(key)
    logger.silly(`[isAuthorized] redisClient.get(${key}): ${cached}`)
    let isAuthorized = cached === 'true' ? true : false

    if (cached == null) {
      isAuthorized = await this.authorizationProvider.isAuthorized(
        endUserId,
        roomId,
        authenticationToken,
      )
      await this.redisClient.set(key, String(isAuthorized), 'ex', 24 * 60 * 60)
    }

    return isAuthorized
  }
}

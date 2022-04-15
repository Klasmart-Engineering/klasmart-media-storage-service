import { withLogger } from '@kl-engineering/kidsloop-nodejs-logger'
import { RequiredDownloadInfo } from '../graphqlResultTypes/requiredDownloadInfo'
import ICacheProvider from '../interfaces/cacheProvider'
import IDownloadInfoProvider from '../interfaces/downloadInfoProvider'

const logger = withLogger('CachedDownloadInfoProvider')

export default class CachedDownloadInfoProvider
  implements IDownloadInfoProvider
{
  public static getCacheKey(mediaId: string, roomId: string) {
    return `CachedDownloadInfoProvider.getDownloadInfo:${mediaId}|${roomId}`
  }

  constructor(
    private readonly downloadInfoProvider: IDownloadInfoProvider,
    private readonly cache: ICacheProvider,
  ) {}

  public async getDownloadInfo(
    mediaId: string,
    roomId: string,
    endUserId: string,
  ): Promise<RequiredDownloadInfo> {
    logger.silly(`[getDownloadInfo] roomId: ${roomId}; mediaId: ${mediaId}`)

    const cacheKey = CachedDownloadInfoProvider.getCacheKey(mediaId, roomId)
    const cached = await this.cache.get(cacheKey)
    if (cached) {
      return JSON.parse(cached)
    }
    const result = await this.downloadInfoProvider.getDownloadInfo(
      mediaId,
      roomId,
      endUserId,
    )
    // TODO: Inject the expiration duration.
    // Expire after 14 minutes. The presigned url is set to expire after 15 minutes.
    // So that gives 1 minute of cushion, which has been more than enough time.
    await this.cache.set(cacheKey, JSON.stringify(result), 840)

    return result
  }
}

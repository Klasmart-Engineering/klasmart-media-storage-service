import { withLogger } from 'kidsloop-nodejs-logger'
import ICacheProvider from '../interfaces/cacheProvider'
import ISymmetricKeyProvider from '../interfaces/symmetricKeyProvider'

const logger = withLogger('SymmetricKeyProvider')

export default class CachedSymmetricKeyProvider
  implements ISymmetricKeyProvider
{
  public static getCacheKey(mediaId: string) {
    return `CachedSymmetricKeyProvider.getBase64SymmetricKey-${mediaId}`
  }

  constructor(
    private readonly symmetricKeyProvider: ISymmetricKeyProvider,
    private readonly cache: ICacheProvider,
  ) {}

  public async getBase64SymmetricKey(
    mediaId: string,
    roomId: string,
    base64UserPublicKey: string,
    base64EncryptedSymmetricKey: string,
  ): Promise<string> {
    logger.silly(
      `[getBase64SymmetricKey] roomId: ${roomId}; mediaId: ${mediaId}`,
    )
    const cacheKey = CachedSymmetricKeyProvider.getCacheKey(mediaId)
    let base64SymmetricKey = await this.cache.get(cacheKey)
    if (!base64SymmetricKey) {
      base64SymmetricKey =
        await this.symmetricKeyProvider.getBase64SymmetricKey(
          mediaId,
          roomId,
          base64UserPublicKey,
          base64EncryptedSymmetricKey,
        )
      await this.cache.set(cacheKey, base64SymmetricKey, 60 * 60)
    }
    return base64SymmetricKey
  }
}

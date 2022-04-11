import { withLogger } from 'kidsloop-nodejs-logger'
import delay from '../helpers/delay'
import ICacheProvider from '../interfaces/cacheProvider'
import IKeyPairProvider from '../interfaces/keyPairProvider'

const logger = withLogger('CachedKeyPairProvider')

export default class CachedKeyPairProvider implements IKeyPairProvider {
  public static getPublicKeyCacheKey(objectKey: string) {
    return `server-public-key-${objectKey}`
  }
  public static getPrivateKeyCacheKey(objectKey: string) {
    return `server-private-key-${objectKey}`
  }
  public static getKeyPairCacheKey(objectKey: string) {
    return `server-key-pair-lock-${objectKey}`
  }

  public constructor(
    private readonly keyPairProvider: IKeyPairProvider,
    private readonly cache: ICacheProvider,
    private readonly ttlSeconds = 60 * 60,
  ) {}

  public async getPublicKeyOrCreatePair(objectKey: string): Promise<string> {
    const cacheKey = CachedKeyPairProvider.getPublicKeyCacheKey(objectKey)
    let base64PublicKey = await this.cache.get(cacheKey)
    if (!base64PublicKey) {
      const lockCacheKey = CachedKeyPairProvider.getKeyPairCacheKey(objectKey)
      const lockObtained = await this.cache.set(lockCacheKey, 'true', 5)
      if (!lockObtained) {
        return this.awaitResultFromOtherRequest(objectKey, cacheKey)
      }
      base64PublicKey = await this.keyPairProvider.getPublicKeyOrCreatePair(
        objectKey,
      )
      await this.cache.set(cacheKey, base64PublicKey, this.ttlSeconds)
    }
    return base64PublicKey
  }

  public async getPrivateKeyOrThrow(objectKey: string): Promise<Uint8Array> {
    const cacheKey = CachedKeyPairProvider.getPrivateKeyCacheKey(objectKey)
    let base64PrivateKey = await this.cache.get(cacheKey)
    if (!base64PrivateKey) {
      const privateKey = await this.keyPairProvider.getPrivateKeyOrThrow(
        objectKey,
      )
      base64PrivateKey = Buffer.from(privateKey).toString('base64')
      await this.cache.set(cacheKey, base64PrivateKey, this.ttlSeconds)
      return privateKey
    }
    return Buffer.from(base64PrivateKey, 'base64')
  }

  private async awaitResultFromOtherRequest(
    objectKey: string,
    cacheKey: string,
  ) {
    logger.debug(
      `[getPublicKeyOrCreatePair] Another request is already creating a key pair for object key (${objectKey}).` +
        `Now awaiting result from that request...`,
    )
    let i = 0
    // Try for a max of 2s.
    while (i < 20) {
      await delay(100)
      const base64PublicKey = await this.cache.get(cacheKey)
      if (base64PublicKey) {
        return base64PublicKey
      }
      i += 1
    }
    throw new Error(
      `[getPublicKeyOrCreatePair] Unable to obtain the lock to create a key pair for object key (${objectKey}).`,
    )
  }
}

import ICacheProvider from '../interfaces/cacheProvider'
import IKeyPairProvider from '../interfaces/keyPairProvider'

export default class CachedKeyPairProvider implements IKeyPairProvider {
  public static getPublicKeyCacheKey(objectKey: string) {
    return `CachedKeyPairProvider.publicKey:${objectKey}`
  }
  public static getPrivateKeyCacheKey(objectKey: string) {
    return `CachedKeyPairProvider.privateKey:${objectKey}`
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
}

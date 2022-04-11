import axios from 'axios'
import RedisClient, { Redis } from 'ioredis'
import { Connection } from 'typeorm'
import { MediaMetadata } from '../entities/mediaMetadata'
import IKeyStorage from '../interfaces/keyStorage'
import IPresignedUrlProvider from '../interfaces/presignedUrlProvider'
import DownloadResolver from '../resolvers/downloadResolver'
import KeyPairProvider from '../providers/keyPairProvider'
import S3KeyStorage from '../helpers/s3KeyStorage'
import S3PresignedUrlProvider from '../providers/s3PresignedUrlProvider'
import IDecryptionProvider from '../interfaces/decryptionProvider'
import TweetnaclDecryption from '../providers/tweetnaclDecryption'
import Config from './config'
import { box } from 'tweetnacl'
import KeyPair from '../helpers/keyPair'
import AuthorizationProvider from '../providers/authorizationProvider'
import { ScheduleApi } from '../web/scheduleApi'
import { PermissionApi } from '../web/permissionApi'
import CachedAuthorizationProvider from '../providers/cachedAuthorizationProvider'
import IAuthorizationProvider from '../interfaces/authorizationProvider'
import { connectToMetadataDatabase } from './connectToMetadataDatabase'
import { withLogger } from 'kidsloop-nodejs-logger'
import { GraphQLClient } from 'graphql-request'
import MetadataResolver from '../resolvers/metadataResolver'
import SymmetricKeyProvider from '../providers/symmetricKeyProvider'
import UploadResolver from '../resolvers/uploadResolver'
import IUploadValidator from '../interfaces/uploadValidator'
import UploadValidator from '../providers/uploadValidator'
import MediaFileStorageChecker from '../providers/mediaFileStorageChecker'
import IMetadataRepository from '../interfaces/metadataRepository'
import TypeormMetadataRepository from '../providers/typeormMetadataRepository'
import ICacheProvider from '../interfaces/cacheProvider'
import MemoryCacheProvider from '../providers/memoryCacheProvider'
import RedisCacheProvider from '../providers/redisCacheProvider'
import IKeyPairProvider from '../interfaces/keyPairProvider'
import CachedKeyPairProvider from '../providers/cachedKeyPairProvider'
import MockAuthorizationProvider from '../providers/mockAuthorizationProvider'
import CachedMetadataRepository from '../providers/cachedMetadataRepository'
import ISymmetricKeyProvider from '../interfaces/symmetricKeyProvider'
import CachedSymmetricKeyProvider from '../providers/cachedSymmetricKeyProvider'
import ITokenParser from '../interfaces/tokenParser'
import TokenParser from './tokenParser'
import CachedTokenParser from './cachedTokenParser'

const logger = withLogger('CompositionRoot')

/**
 * Only the `buildObjectGraph` and `getXxxResolver` methods should be public.
 * For tests, inherit this class to override disired methods e.g. mocks.
 */
export default class CompositionRoot {
  // Resolvers
  protected downloadResolver?: DownloadResolver
  protected metadataResolver?: MetadataResolver
  protected uploadResolver?: UploadResolver
  // Resolver dependencies
  protected redis?: Redis
  protected typeorm?: Connection
  protected keyPairProvider?: IKeyPairProvider
  protected presignedUrlProvider?: IPresignedUrlProvider
  protected uploadValidator?: UploadValidator
  protected metadataRepository?: IMetadataRepository
  protected authorizationProvider?: IAuthorizationProvider
  protected symmetricKeyProvider?: ISymmetricKeyProvider
  protected cachePruneTicker?: NodeJS.Timer
  protected tickerCallbacks: (() => void)[] = []

  /**
   * Call this method at service startup to instantiate the GraphQL resolvers.
   * Useful to validate configuration asap. Otherwise, the resolvers are lazily
   * instantiated the first time they're accessed.
   */
  public async buildObjectGraph() {
    this.typeorm = await this.connectToDb()
    this.downloadResolver = this.getDownloadResolver()
    this.metadataResolver = this.getMetadataResolver()
    this.uploadResolver = this.getUploadResolver()
  }

  protected connectToDb() {
    return connectToMetadataDatabase(Config.getMetadataDatabaseUrl())
  }

  public getDownloadResolver(): DownloadResolver {
    this.downloadResolver ??= new DownloadResolver(
      this.getMetadataRepository(),
      this.getSymmetricKeyProvider(),
      this.getPresignedUrlProvider(),
      this.getAuthorizationProvider(),
    )
    return this.downloadResolver
  }

  public getMetadataResolver(): MetadataResolver {
    this.metadataResolver ??= new MetadataResolver(this.getMetadataRepository())
    return this.metadataResolver
  }

  public getUploadResolver(): UploadResolver {
    this.uploadResolver ??= new UploadResolver(
      this.getKeyPairProvider(),
      this.getPresignedUrlProvider(),
      this.getMetadataRepository(),
      this.getUploadValidator(),
    )
    return this.uploadResolver
  }

  public getTokenParser(): ITokenParser {
    let tokenParser = new TokenParser()
    if (Config.getCache()) {
      tokenParser = new CachedTokenParser(tokenParser, this.getCacheProvider())
    }
    return tokenParser
  }

  protected getKeyPairProvider(): IKeyPairProvider {
    if (this.keyPairProvider != null) {
      return this.keyPairProvider
    }
    this.keyPairProvider = new KeyPairProvider(
      this.getPublicKeyStorage(),
      this.getPrivateKeyStorage(),
      this.getKeyPairFactory(),
    )
    if (Config.getCache()) {
      this.keyPairProvider = new CachedKeyPairProvider(
        this.keyPairProvider,
        this.getCacheProvider(),
      )
    }
    return this.keyPairProvider
  }

  protected getPresignedUrlProvider(): IPresignedUrlProvider {
    this.presignedUrlProvider ??= new S3PresignedUrlProvider(
      Config.getMediaFileBucket(),
      Config.getS3Client(),
    )
    return this.presignedUrlProvider
  }

  protected getAuthorizationProvider(): IAuthorizationProvider {
    if (this.authorizationProvider != null) {
      return this.authorizationProvider
    }
    if (Config.useMockWebApis()) {
      this.authorizationProvider = new MockAuthorizationProvider()
    } else {
      this.authorizationProvider = new AuthorizationProvider(
        this.getScheduleApi(),
        this.getPermissionApi(),
      )
    }
    if (Config.getCache()) {
      this.authorizationProvider = new CachedAuthorizationProvider(
        this.authorizationProvider,
        this.getCacheProvider(),
      )
    }
    return this.authorizationProvider
  }

  protected getCacheProvider(): ICacheProvider {
    if (Config.getCache() === 'redis') {
      return new RedisCacheProvider(this.getRedisClient())
    }
    const memoryCache = new MemoryCacheProvider(Date)
    this.tickerCallbacks.push(() => memoryCache.prune())
    this.startCachePruneTicker()
    return memoryCache
  }

  protected getRedisClient() {
    this.redis ??= new RedisClient({
      port: Config.getRedisPort(),
      host: Config.getRedisHost(),
      keyPrefix: 'media:',
    })
    return this.redis
  }

  protected getScheduleApi(): ScheduleApi {
    return new ScheduleApi(axios, Config.getCmsApiUrl())
  }

  protected getPermissionApi(): PermissionApi {
    return new PermissionApi(new GraphQLClient(Config.getUserServiceEndpoint()))
  }

  protected getSymmetricKeyProvider(): ISymmetricKeyProvider {
    if (this.symmetricKeyProvider != null) {
      return this.symmetricKeyProvider
    }
    this.symmetricKeyProvider = new SymmetricKeyProvider(
      this.getKeyPairProvider(),
      this.getDecryptionProvider(),
    )
    if (Config.getCache()) {
      this.symmetricKeyProvider = new CachedSymmetricKeyProvider(
        this.symmetricKeyProvider,
        this.getCacheProvider(),
      )
    }
    return this.symmetricKeyProvider
  }

  protected getDecryptionProvider(): IDecryptionProvider {
    return new TweetnaclDecryption()
  }

  protected getPublicKeyStorage(): IKeyStorage {
    return new S3KeyStorage(Config.getPublicKeyBucket(), Config.getS3Client())
  }

  protected getPrivateKeyStorage(): IKeyStorage {
    return new S3KeyStorage(Config.getPrivateKeyBucket(), Config.getS3Client())
  }

  protected getKeyPairFactory(): () => KeyPair {
    return () => {
      const boxKeyPair = box.keyPair()
      return new KeyPair(boxKeyPair.publicKey, boxKeyPair.secretKey)
    }
  }

  protected getMetadataRepository(): IMetadataRepository {
    if (!this.typeorm) {
      throw new Error('typeorm should have been instantiated by now.')
    }
    if (this.metadataRepository != null) {
      return this.metadataRepository
    }
    this.metadataRepository = new TypeormMetadataRepository(
      this.typeorm.getRepository(MediaMetadata),
    )
    if (Config.getCache()) {
      this.metadataRepository = new CachedMetadataRepository(
        this.metadataRepository,
        this.getCacheProvider(),
      )
    }
    return this.metadataRepository
  }

  protected getUploadValidator(): IUploadValidator {
    this.uploadValidator ??= new UploadValidator(
      this.getMediaFileStorageChecker(),
      Config.getFileValidationDelayMs(),
    )
    return this.uploadValidator
  }

  protected getMediaFileStorageChecker(): MediaFileStorageChecker {
    return new MediaFileStorageChecker(
      Config.getS3Client(),
      Config.getMediaFileBucket(),
    )
  }

  protected startCachePruneTicker() {
    this.cachePruneTicker ??= setInterval(() => {
      this.tickerCallbacks.forEach((cb) => cb())
    }, 24 * 60 * 60 * 1000)
  }

  public async cleanUp() {
    logger.debug('[cleanUp] disconnecting from redis and typeorm...')
    await this.redis?.quit()
    await this.typeorm?.close()
    this.uploadValidator?.cleanUp()
    if (this.cachePruneTicker) {
      clearTimeout(this.cachePruneTicker)
    }
  }
}

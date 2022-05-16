import axios from 'axios'
import RedisClient, { Redis } from 'ioredis'
import { Connection } from 'typeorm'
import { MediaMetadata } from '../entities/mediaMetadata'
import IKeyStorage from '../interfaces/keyStorage'
import IPresignedUrlProvider from '../interfaces/presignedUrlProvider'
import DownloadResolver from '../resolvers/downloadResolver'
import KeyPairProvider from '../providers/keyPairProvider'
import S3KeyStorage from '../providers/s3KeyStorage'
import S3PresignedUrlProvider from '../providers/s3PresignedUrlProvider'
import IDecryptionProvider from '../interfaces/decryptionProvider'
import TweetnaclDecryption from '../providers/tweetnaclDecryption'
import AppConfig from '../config/config'
import { box } from 'tweetnacl'
import KeyPair from '../helpers/keyPair'
import AuthorizationProvider from '../providers/authorizationProvider'
import { ScheduleApi } from '../web/scheduleApi'
import { PermissionApi } from '../web/permissionApi'
import CachedAuthorizationProvider from '../caching/cachedAuthorizationProvider'
import IAuthorizationProvider from '../interfaces/authorizationProvider'
import { connectToMetadataDatabase } from './connectToMetadataDatabase'
import { withLogger } from '@kl-engineering/kidsloop-nodejs-logger'
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
import MemoryCacheProvider from '../caching/memoryCacheProvider'
import RedisCacheProvider from '../caching/redisCacheProvider'
import IKeyPairProvider from '../interfaces/keyPairProvider'
import CachedKeyPairProvider from '../caching/cachedKeyPairProvider'
import MockAuthorizationProvider from '../providers/mockAuthorizationProvider'
import CachedMetadataRepository from '../caching/cachedMetadataRepository'
import ISymmetricKeyProvider from '../interfaces/symmetricKeyProvider'
import CachedSymmetricKeyProvider from '../caching/cachedSymmetricKeyProvider'
import ITokenParser from '../interfaces/tokenParser'
import TokenParser from '../providers/tokenParser'
import CachedTokenParser from '../caching/cachedTokenParser'
import { ApplicationError } from '../errors/applicationError'
import IDownloadInfoProvider from '../interfaces/downloadInfoProvider'
import DownloadInfoProvider from '../providers/downloadInfoProvider'
import CachedDownloadInfoProvider from '../caching/cachedDownloadInfoProvider'
import { StatsInput, StatsProvider } from '../providers/statsProvider'
import { error2Obj } from '../errors/errorUtil'
import { RaceConditionCacheProvider } from '../caching/RaceConditionCacheProvider'

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
  protected periodicScheduler?: NodeJS.Timer
  protected schedulerCallbacks: (() => void)[] = []
  protected statsProvider?: StatsProvider

  constructor(private readonly config = AppConfig.default) {}

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
    this.initStatsProvider()
  }

  protected connectToDb() {
    return connectToMetadataDatabase(this.config.metadataDatabaseUrl)
  }

  public getDownloadResolver(): DownloadResolver {
    this.downloadResolver ??= new DownloadResolver(
      this.getDownloadInfoProvider(),
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

  protected getDownloadInfoProvider(): IDownloadInfoProvider {
    let downloadInfoProvider: IDownloadInfoProvider = new DownloadInfoProvider(
      this.getMetadataRepository(),
      this.getSymmetricKeyProvider(),
      this.getPresignedUrlProvider(),
    )
    if (this.config.cache) {
      downloadInfoProvider = new CachedDownloadInfoProvider(
        downloadInfoProvider,
        this.getCacheProvider(),
      )
    }
    return downloadInfoProvider
  }

  public getTokenParser(): ITokenParser {
    let tokenParser = new TokenParser()
    if (this.config.cache) {
      // Use a memory cache because I think the overhead of Redis decreases the benefit of token caching.
      // Load testing reveals that memory caching is almost twice as fast as Redis.
      const memoryCache = new MemoryCacheProvider(Date)
      this.schedulerCallbacks.push(() => memoryCache.prune())
      this.startPeriodicScheduler()
      tokenParser = new CachedTokenParser(tokenParser, memoryCache)
    }
    return tokenParser
  }

  protected initStatsProvider(): void {
    this.statsProvider = this.getStatsProvider()
    this.schedulerCallbacks.push(async () => {
      try {
        const input = this.getStatsInput()
        const stats = await this.statsProvider?.calculateTotals(input)
        logger.info('DAILY STATS SUMMARY (across all instances):', { stats })
      } catch (error) {
        logger.error('[initStatsProvider] Failed to log stats.', {
          error: error2Obj(error),
        })
      }
    })
    this.startPeriodicScheduler()
  }

  protected getStatsProvider(): StatsProvider | undefined {
    // TODO: Consider also supporting non-redis stat provider.
    if (this.config.cache !== 'redis') {
      return
    }
    this.statsProvider ??= new StatsProvider(this.getRedisClient())
    return this.statsProvider
  }

  protected getStatsInput(): StatsInput {
    return Object.assign(
      {},
      this.getUploadResolver().getStatsAndReset(),
      this.getMetadataResolver().getStatsAndReset(),
      this.getDownloadResolver().getStatsAndReset(),
    )
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
    if (this.config.cache) {
      this.keyPairProvider = new CachedKeyPairProvider(
        this.keyPairProvider,
        new RaceConditionCacheProvider(this.getCacheProvider()),
      )
    }
    return this.keyPairProvider
  }

  protected getPresignedUrlProvider(): IPresignedUrlProvider {
    this.presignedUrlProvider ??= new S3PresignedUrlProvider(
      this.config.mediaFileBucket,
      this.config.s3Client,
    )
    return this.presignedUrlProvider
  }

  protected getAuthorizationProvider(): IAuthorizationProvider {
    if (this.authorizationProvider != null) {
      return this.authorizationProvider
    }
    if (this.config.useMockWebApis) {
      this.authorizationProvider = new MockAuthorizationProvider()
    } else {
      this.authorizationProvider = new AuthorizationProvider(
        this.getScheduleApi(),
        this.getPermissionApi(),
      )
    }
    if (this.config.cache) {
      this.authorizationProvider = new CachedAuthorizationProvider(
        this.authorizationProvider,
        this.getCacheProvider(),
      )
    }
    return this.authorizationProvider
  }

  protected getCacheProvider(): ICacheProvider {
    if (this.config.cache === 'redis') {
      return new RedisCacheProvider(this.getRedisClient())
    }
    const memoryCache = new MemoryCacheProvider(Date)
    this.schedulerCallbacks.push(() => memoryCache.prune())
    this.startPeriodicScheduler()
    return memoryCache
  }

  protected getRedisClient() {
    this.redis ??= new RedisClient({
      port: this.config.redisPort,
      host: this.config.redisHost,
      keyPrefix: 'media:',
    })
    //this.redis.ping((e, message) => console.log('message:' + message, e))
    return this.redis
  }

  protected getScheduleApi(): ScheduleApi {
    return new ScheduleApi(axios, this.config.cmsApiUrl)
  }

  protected getPermissionApi(): PermissionApi {
    return new PermissionApi(new GraphQLClient(this.config.userServiceEndpoint))
  }

  protected getSymmetricKeyProvider(): ISymmetricKeyProvider {
    if (this.symmetricKeyProvider != null) {
      return this.symmetricKeyProvider
    }
    this.symmetricKeyProvider = new SymmetricKeyProvider(
      this.getKeyPairProvider(),
      this.getDecryptionProvider(),
    )
    if (this.config.cache) {
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
    return new S3KeyStorage(this.config.publicKeyBucket, this.config.s3Client)
  }

  protected getPrivateKeyStorage(): IKeyStorage {
    return new S3KeyStorage(this.config.privateKeyBucket, this.config.s3Client)
  }

  protected getKeyPairFactory(): () => KeyPair {
    return () => {
      const boxKeyPair = box.keyPair()
      return new KeyPair(boxKeyPair.publicKey, boxKeyPair.secretKey)
    }
  }

  protected getMetadataRepository(): IMetadataRepository {
    if (!this.typeorm) {
      throw new ApplicationError(
        'typeorm should have been instantiated by now.',
      )
    }
    if (this.metadataRepository != null) {
      return this.metadataRepository
    }
    this.metadataRepository = new TypeormMetadataRepository(
      this.typeorm.getRepository(MediaMetadata),
    )
    if (this.config.cache) {
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
      this.config.fileValidationDelayMs,
    )
    return this.uploadValidator
  }

  protected getMediaFileStorageChecker(): MediaFileStorageChecker {
    return new MediaFileStorageChecker(
      this.config.s3Client,
      this.config.mediaFileBucket,
    )
  }

  protected startPeriodicScheduler() {
    const { offset, period } = this.config.statsLogConfig
    this.periodicScheduler ??= setTimeout(() => {
      this.schedulerCallbacks.forEach((cb) => cb())
      this.periodicScheduler = setInterval(() => {
        this.schedulerCallbacks.forEach((cb) => cb())
      }, period)
    }, offset)
  }

  public async shutDown(): Promise<void> {
    if (this.statsProvider) {
      try {
        const input = this.getStatsInput()
        await this.statsProvider.appendToSharedStorage(input)
        logger.debug(`[shutDown] Stats successfully saved to shared storage.`)
      } catch (error) {
        logger.error('[shutDown] Failed to save stats to shared storage.', {
          error: error2Obj(error),
        })
      }
    }
    await this.cleanUp()
  }

  public async cleanUp() {
    logger.debug(
      '[cleanUp] Closing open connections and cleaning up resources...',
    )
    await Promise.allSettled([this.redis?.quit(), this.typeorm?.close()])
    this.redis = undefined
    this.typeorm = undefined
    this.uploadValidator?.cleanUp()
    if (this.periodicScheduler) {
      clearTimeout(this.periodicScheduler)
    }
  }
}

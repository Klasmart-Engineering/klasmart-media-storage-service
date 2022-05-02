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
import Config from '../config/config'
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
import error2Json from '../errors/error2Json'

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
    return connectToMetadataDatabase(Config.getMetadataDatabaseUrl())
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

  public getDownloadInfoProvider(): IDownloadInfoProvider {
    let downloadInfoProvider: IDownloadInfoProvider = new DownloadInfoProvider(
      this.getMetadataRepository(),
      this.getSymmetricKeyProvider(),
      this.getPresignedUrlProvider(),
    )
    if (Config.getCache()) {
      downloadInfoProvider = new CachedDownloadInfoProvider(
        downloadInfoProvider,
        this.getCacheProvider(),
      )
    }
    return downloadInfoProvider
  }

  public getTokenParser(): ITokenParser {
    let tokenParser = new TokenParser()
    if (Config.getCache()) {
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
    // TODO: Consider also supporting non-redis stat provider.
    if (this.statsProvider || Config.getCache() !== 'redis') {
      return
    }
    this.statsProvider = new StatsProvider(this.getRedisClient())
    this.schedulerCallbacks.push(async () => {
      try {
        const input = this.getStatsInput()
        const output = await this.statsProvider?.calculateTotals(input)
        logger.info(
          'DAILY STATS SUMMARY (across all instances): ' +
            JSON.stringify(output),
        )
      } catch (error) {
        const appError = new ApplicationError(
          '[initStatsProvider] Failed to log stats.',
          error,
        )
        logger.error(error2Json(appError))
      }
    })
    this.startPeriodicScheduler()
  }

  protected getStatsInput(): StatsInput {
    return Object.assign(
      {},
      this.getUploadResolver().getStats(),
      this.getMetadataResolver().getStats(),
      this.getDownloadResolver().getStats(),
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
    this.schedulerCallbacks.push(() => memoryCache.prune())
    this.startPeriodicScheduler()
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

  protected startPeriodicScheduler() {
    const nextStartDate = new Date().setHours(24, 0, 0, 0)
    const currentDate = Date.now()
    const offset = nextStartDate - currentDate
    this.periodicScheduler ??= setTimeout(() => {
      this.schedulerCallbacks.forEach((cb) => cb())
      this.periodicScheduler = setInterval(() => {
        this.schedulerCallbacks.forEach((cb) => cb())
      }, 24 * 60 * 60 * 1000)
    }, offset)
  }

  public async shutDown(): Promise<void> {
    if (!this.statsProvider) {
      return
    }
    try {
      const input = this.getStatsInput()
      await this.statsProvider.appendToSharedStorage(input)
      const statsJson = JSON.stringify(input)
      logger.debug(
        `[shutDown] Stats successfully saved to shared storage: ${statsJson}`,
      )
    } catch (error) {
      const appError = new ApplicationError(
        '[shutDown] Failed to save stats to shared storage.',
        error,
      )
      logger.error(error2Json(appError))
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

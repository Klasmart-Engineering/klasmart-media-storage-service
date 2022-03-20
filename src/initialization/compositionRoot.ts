import axios from 'axios'
import RedisClient, { Redis } from 'ioredis'
import { Connection } from 'typeorm'
import { MediaMetadata } from '../entities/mediaMetadata'
import IKeyStorage from '../interfaces/keyStorage'
import IPresignedUrlProvider from '../interfaces/presignedUrlProvider'
import { DownloadResolver } from '../resolvers/downloadResolver'
import { KeyPairProvider } from '../providers/keyPairProvider'
import { S3KeyStorage } from '../helpers/s3KeyStorage'
import { S3PresignedUrlProvider } from '../providers/s3PresignedUrlProvider'
import IDecryptionProvider from '../interfaces/decryptionProvider'
import TweetnaclDecryption from '../providers/tweetnaclDecryption'
import { Config } from './config'
import { box } from 'tweetnacl'
import { KeyPair } from '../helpers/keyPair'
import AuthorizationProvider from '../providers/authorizationProvider'
import { ScheduleApi } from '../web/scheduleApi'
import { PermissionApi } from '../web/permissionApi'
import RedisAuthorizationProvider from '../providers/redisAuthorizationProvider'
import { IAuthorizationProvider } from '../interfaces/authorizationProvider'
import { connectToMetadataDatabase } from './connectToMetadataDatabase'
import { withLogger } from 'kidsloop-nodejs-logger'
import { GraphQLClient } from 'graphql-request'
import { MetadataResolver } from '../resolvers/metadataResolver'
import SymmetricKeyProvider from '../providers/symmetricKeyProvider'
import { UploadResolver } from '../resolvers/uploadResolver'
import IUploadValidator from '../interfaces/uploadValidator'
import UploadValidator from '../providers/uploadValidator'
import { MediaFileStorageChecker } from '../providers/mediaFileStorageChecker'
import IMetadataRepository from '../interfaces/metadataRepository'
import TypeormMetadataRepository from '../providers/typeormMetadataRepository'

const logger = withLogger('CompositionRoot')

/**
 * Only the `buildObjectGraph` and `getXxxResolver` methods should be public.
 * For tests, inherit this class to override disired methods e.g. mocks.
 */
export class CompositionRoot {
  // Resolvers
  protected downloadResolver?: DownloadResolver
  protected metadataResolver?: MetadataResolver
  protected uploadResolver?: UploadResolver
  // Resolver dependencies
  protected redis?: Redis
  protected typeorm?: Connection
  protected keyPairProvider?: KeyPairProvider
  protected presignedUrlProvider?: IPresignedUrlProvider
  protected uploadValidator?: UploadValidator
  protected metadataRepository?: IMetadataRepository

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

  protected getKeyPairProvider(): KeyPairProvider {
    this.keyPairProvider ??= new KeyPairProvider(
      this.getPublicKeyStorage(),
      this.getPrivateKeyStorage(),
      this.getKeyPairFactory(),
    )
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
    let result: IAuthorizationProvider = new AuthorizationProvider(
      this.getScheduleApi(),
      this.getPermissionApi(),
    )
    if (Config.getRedisHost() && Config.getRedisPort()) {
      result = new RedisAuthorizationProvider(result, this.getRedisClient())
    }
    return result
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

  protected getSymmetricKeyProvider(): SymmetricKeyProvider {
    return new SymmetricKeyProvider(
      this.getKeyPairProvider(),
      this.getDecryptionProvider(),
    )
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
    this.metadataRepository ??= new TypeormMetadataRepository(
      this.typeorm.getRepository(MediaMetadata),
    )
    return this.metadataRepository
  }

  protected getUploadValidator(): IUploadValidator {
    this.uploadValidator ??= new UploadValidator(
      this.getMediaFileStorageChecker(),
      (mediaId) => this.getMetadataRepository().delete(mediaId),
      // TODO: Config.getFileValidationDelayMs()
      60000,
    )
    return this.uploadValidator
  }

  protected getMediaFileStorageChecker(): MediaFileStorageChecker {
    return new MediaFileStorageChecker(
      Config.getS3Client(),
      Config.getMediaFileBucket(),
    )
  }

  public async cleanUp() {
    logger.debug('[cleanUp] disconnecting from redis and typeorm...')
    await this.redis?.quit()
    await this.typeorm?.close()
    this.uploadValidator?.cleanUp()
  }
}

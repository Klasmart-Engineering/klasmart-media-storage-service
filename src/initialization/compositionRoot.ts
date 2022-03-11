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
import { UploadResolver } from '../resolvers/uploadResolver'
import { MetadataResolver } from '../resolvers/metadataResolver'
import SymmetricKeyProvider from '../providers/symmetricKeyProvider'

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

  /**
   * Call this method at service startup to instantiate the GraphQL resolvers.
   * Useful to validate configuration asap. Otherwise, the resolvers are lazily
   * instantiated the first time they're accessed.
   */
  public async buildObjectGraph() {
    this.downloadResolver = await this.getDownloadResolver()
    this.metadataResolver = await this.getMetadataResolver()
    this.uploadResolver = await this.getUploadResolver()
  }

  public async getDownloadResolver(): Promise<DownloadResolver> {
    this.downloadResolver ??= new DownloadResolver(
      await this.getMetadataRepository(),
      this.getSymmetricKeyProvider(),
      this.getPresignedUrlProvider(),
      this.getAuthorizationProvider(),
    )
    return this.downloadResolver
  }

  public async getMetadataResolver(): Promise<MetadataResolver> {
    this.metadataResolver ??= new MetadataResolver(
      await this.getMetadataRepository(),
    )
    return this.metadataResolver
  }

  public async getUploadResolver(): Promise<UploadResolver> {
    this.uploadResolver ??= new UploadResolver(
      this.getKeyPairProvider(),
      this.getPresignedUrlProvider(),
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
    //this.redis.ping()
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

  protected async getMetadataRepository() {
    if (!this.typeorm) {
      this.typeorm = await connectToMetadataDatabase(
        Config.getMetadataDatabaseUrl(),
      )
    }
    return this.typeorm.getRepository(MediaMetadata)
  }

  public async cleanUp() {
    logger.debug('[cleanUp] disconnecting from redis and typeorm...')
    await this.redis?.quit()
    await this.typeorm?.close()
  }
}

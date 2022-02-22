import axios from 'axios'
import RedisClient, { Redis } from 'ioredis'
import { Connection } from 'typeorm'
import { AudioMetadata } from '../entities/audioMetadata'
import IKeyStorage from '../interfaces/keyStorage'
import IUploadUrlProvider from '../interfaces/presignedUrlProvider'
import { AudioResolver } from '../resolvers/audioResolver'
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

const logger = withLogger('CompositionRoot')

/**
 * Only the `buildObjectGraph` and `getXxxResolver` methods should be public.
 * For tests, inherit this class to override disired methods e.g. mocks.
 */
export class CompositionRoot {
  protected redis?: Redis
  protected typeorm?: Connection
  protected audioResolver?: AudioResolver

  /**
   * Call this method at service startup to instantiate the GraphQL resolvers.
   * Useful to validate configuration asap. Otherwise, the resolvers are lazily
   * instantiated the first time they're accessed.
   */
  public async buildObjectGraph() {
    this.audioResolver = await this.getAudioResolver()
  }

  public async getAudioResolver(): Promise<AudioResolver> {
    this.audioResolver ??= new AudioResolver(
      await this.getMetadataRepository(),
      this.getKeyPairProvider(),
      this.getDecryptionProvider(),
      this.getPresignedUrlProvider(),
      this.getAuthorizationProvider(),
    )
    return this.audioResolver
  }

  protected getKeyPairProvider(): KeyPairProvider {
    return new KeyPairProvider(
      this.getPublicKeyStorage(),
      this.getPrivateKeyStorage(),
      this.getKeyPairFactory(),
    )
  }

  protected getPresignedUrlProvider(): IUploadUrlProvider {
    return new S3PresignedUrlProvider(
      Config.getAudioFileBucket(),
      Config.getS3Client(),
    )
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
      keyPrefix: 'audio:',
    })
    return this.redis
  }

  protected getScheduleApi(): ScheduleApi {
    return new ScheduleApi(axios, Config.getCmsApiUrl())
  }

  protected getPermissionApi(): PermissionApi {
    return new PermissionApi(new GraphQLClient(Config.getUserServiceEndpoint()))
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
    return this.typeorm.getRepository(AudioMetadata)
  }

  public async cleanUp() {
    logger.debug('[cleanUp] disconnecting from redis and typeorm...')
    await this.redis?.quit()
    await this.typeorm?.close()
    this.redis = undefined
    this.typeorm = undefined
    this.audioResolver = undefined
  }
}

/* eslint-disable node/no-process-env */
import { S3Client } from '@aws-sdk/client-s3'
import throwExpression from '../helpers/throwExpression'

export default class Config {
  private static s3Client: S3Client
  public static getS3Client(): S3Client {
    this.s3Client ??= new S3Client({
      endpoint: process.env.S3_BUCKET_ENDPOINT,
      // Needed with minio.
      forcePathStyle: true,
    })
    return this.s3Client
  }

  public static getCorsDomain(): string {
    return process.env.DOMAIN ?? throwExpression('DOMAIN must be defined')
  }

  public static getMetadataDatabaseUrl(): string {
    return (
      process.env.METADATA_DATABASE_URL ??
      throwExpression('METADATA_DATABASE_URL must be defined')
    )
  }

  public static getPublicKeyBucket(): string {
    return (
      process.env.PUBLIC_KEY_BUCKET ??
      throwExpression('PUBLIC_KEY_BUCKET must be defined')
    )
  }

  public static getPrivateKeyBucket(): string {
    return (
      process.env.PRIVATE_KEY_BUCKET ??
      throwExpression('PRIVATE_KEY_BUCKET must be defined')
    )
  }

  public static getMediaFileBucket(): string {
    return (
      process.env.MEDIA_FILE_BUCKET ??
      throwExpression('MEDIA_FILE_BUCKET must be defined')
    )
  }

  static useMockWebApis(): boolean {
    return process.env.MOCK_WEB_APIS === 'true'
  }

  static getCmsApiUrl(): string {
    return (
      process.env.CMS_API_URL ?? throwExpression('CMS_API_URL must be defined')
    )
  }

  static getUserServiceEndpoint(): string {
    return (
      process.env.USER_SERVICE_ENDPOINT ??
      throwExpression('USER_SERVICE_ENDPOINT must be defined')
    )
  }

  static getFileValidationDelayMs(): number {
    return 60000
  }

  static getCache(): 'redis' | 'memory' | undefined {
    const cache = process.env.CACHE
    if (cache !== 'redis' && cache !== 'memory' && cache !== undefined) {
      throw new Error(
        "Invalid value for CACHE. Valid options: 'redis', 'memory', or undefined",
      )
    }
    return cache
  }

  static getRedisHost(): string | undefined {
    return process.env.REDIS_HOST
  }

  static getRedisPort(): number | undefined {
    return process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : undefined
  }
}

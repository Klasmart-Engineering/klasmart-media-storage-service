/* eslint-disable node/no-process-env */
import { S3Client } from '@aws-sdk/client-s3'
import { ApplicationError } from '../errors/applicationError'
import throwExpression from '../helpers/throwExpression'

export default class AppConfig {
  // implements AppConfig
  private static instance: AppConfig
  public static get default(): AppConfig {
    AppConfig.instance ??= new AppConfig()
    return AppConfig.instance
  }

  private _s3Client?: S3Client
  public get s3Client(): S3Client {
    this._s3Client ??= new S3Client({
      endpoint: process.env.S3_BUCKET_ENDPOINT,
      // Needed with minio.
      forcePathStyle: true,
    })
    return this._s3Client
  }

  public get corsDomain(): string {
    return process.env.DOMAIN ?? throwExpression('DOMAIN must be defined')
  }

  public get metadataDatabaseUrl(): string {
    return (
      process.env.METADATA_DATABASE_URL ??
      throwExpression('METADATA_DATABASE_URL must be defined')
    )
  }

  public get publicKeyBucket(): string {
    return (
      process.env.PUBLIC_KEY_BUCKET ??
      throwExpression('PUBLIC_KEY_BUCKET must be defined')
    )
  }

  public get privateKeyBucket(): string {
    return (
      process.env.PRIVATE_KEY_BUCKET ??
      throwExpression('PRIVATE_KEY_BUCKET must be defined')
    )
  }

  public get mediaFileBucket(): string {
    return (
      process.env.MEDIA_FILE_BUCKET ??
      throwExpression('MEDIA_FILE_BUCKET must be defined')
    )
  }

  public get useMockWebApis(): boolean {
    return process.env.MOCK_WEB_APIS === 'true'
  }

  public get cmsApiUrl(): string {
    return (
      process.env.CMS_API_URL ?? throwExpression('CMS_API_URL must be defined')
    )
  }

  public get userServiceEndpoint(): string {
    return (
      process.env.USER_SERVICE_ENDPOINT ??
      throwExpression('USER_SERVICE_ENDPOINT must be defined')
    )
  }

  public get fileValidationDelayMs(): number {
    return 30000
  }

  public get statsLogConfig(): { offset: number; period: number } {
    const nextStartDate = new Date().setHours(24, 0, 0, 0)
    const currentDate = Date.now()
    const offset = nextStartDate - currentDate
    const period = 24 * 60 * 60 * 1000
    return { offset, period }
  }

  public get cache(): 'redis' | 'memory' | undefined {
    const cache = process.env.CACHE
    if (cache !== 'redis' && cache !== 'memory' && cache !== undefined) {
      throw new ApplicationError(
        "Invalid value for CACHE. Valid options: 'redis', 'memory', or undefined",
      )
    }
    return cache
  }

  public get redisHost(): string | undefined {
    if (process.env.CACHE === 'redis' && !process.env.REDIS_HOST) {
      throwExpression("REDIS_HOST must be defined if CACHE is set to 'redis'")
    }
    return process.env.REDIS_HOST
  }

  public get redisPort(): number {
    if (process.env.CACHE === 'redis' && !process.env.REDIS_PORT) {
      throwExpression("REDIS_PORT must be defined if CACHE is set to 'redis'")
    }
    const port = Number(process.env.REDIS_PORT)
    if (isNaN(port)) {
      throwExpression('REDIS_PORT is NaN')
    }
    return port
  }

  /**
   * This is used in place of presigned download URLs in regions that don't
   * support AWS. Apparently, presigned upload URLs are fine.
   */
  public get cdnUrl(): URL | undefined {
    if (!process.env.CDN_URL) {
      return undefined
    }
    return new URL(process.env.CDN_URL)
  }
}

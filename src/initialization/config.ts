import AWS from 'aws-sdk'
import { throwExpression } from '../helpers/throwExpression'

export class Config {
  public static getS3Client(): AWS.S3 {
    return new AWS.S3({
      endpoint: process.env.S3_BUCKET_ENDPOINT,
      // Needed with minio.
      s3ForcePathStyle: true,
      signatureVersion: 'v4',
      // Needed for private key storage. Otherwise,
      // "Requests specifying Server Side Encryption with AWS KMS managed keys must be made over a secure connection"
      sslEnabled: true,
      correctClockSkew: true,
    })
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

  public static getAudioFileBucket(): string {
    return (
      process.env.AUDIO_FILE_BUCKET ??
      throwExpression('AUDIO_FILE_BUCKET must be defined')
    )
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

  static getRedisHost(): string | undefined {
    return process.env.REDIS_HOST
  }

  static getRedisPort(): number | undefined {
    return process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : undefined
  }
}

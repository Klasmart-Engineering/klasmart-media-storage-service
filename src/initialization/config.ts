import AWS from 'aws-sdk'
import { throwExpression } from '../helpers/throwExpression'

export class Config {
  public static getS3Client(): AWS.S3 {
    return new AWS.S3({
      endpoint: process.env.S3_BUCKET_ENDPOINT,
      // Needed with minio.
      s3ForcePathStyle: true,
      signatureVersion: 'v4',
      sslEnabled: process.env.NODE_ENV === 'production',
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
}

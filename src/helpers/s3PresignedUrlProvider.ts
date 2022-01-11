import AWS from 'aws-sdk'
import IPresignedUrlProvider from '../interfaces/presignedUrlProvider'

export class S3PresignedUrlProvider implements IPresignedUrlProvider {
  public constructor(
    private readonly bucketName: string,
    private readonly s3Client: AWS.S3,
  ) {}

  public getUploadUrl(audioId: string, mimeType: string): Promise<string> {
    const bucketParams = {
      Bucket: this.bucketName,
      Key: audioId,
      ContentType: mimeType,
      Expires: 60,
    }
    return this.s3Client.getSignedUrlPromise('putObject', bucketParams)
  }

  public getDownloadUrl(audioId: string): Promise<string> {
    const bucketParams = {
      Bucket: this.bucketName,
      Key: audioId,
      Expires: 60,
    }
    return this.s3Client.getSignedUrlPromise('getObject', bucketParams)
  }
}

import {
  S3Client,
  GetObjectCommand,
  GetObjectCommandInput,
  PutObjectCommand,
  PutObjectCommandInput,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import IPresignedUrlProvider from '../interfaces/presignedUrlProvider'

export default class S3PresignedUrlProvider implements IPresignedUrlProvider {
  public constructor(
    private readonly bucketName: string,
    private readonly s3Client: S3Client,
  ) {}

  public getUploadUrl(objectKey: string, mimeType: string): Promise<string> {
    const params: PutObjectCommandInput = {
      Bucket: this.bucketName,
      Key: objectKey,
      ContentType: mimeType,
    }
    const command = new PutObjectCommand(params)
    return getSignedUrl(this.s3Client, command, { expiresIn: 60 })
  }

  public getDownloadUrl(objectKey: string): Promise<string> {
    const params: GetObjectCommandInput = {
      Bucket: this.bucketName,
      Key: objectKey,
    }
    const command = new GetObjectCommand(params)
    return getSignedUrl(this.s3Client, command, { expiresIn: 900 })
  }
}

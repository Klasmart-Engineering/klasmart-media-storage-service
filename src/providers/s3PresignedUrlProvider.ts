import {
  S3Client,
  GetObjectCommand,
  GetObjectCommandInput,
  PutObjectCommand,
  PutObjectCommandInput,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import IPresignedUrlProvider from '../interfaces/presignedUrlProvider'

export class S3PresignedUrlProvider implements IPresignedUrlProvider {
  public constructor(
    private readonly bucketName: string,
    private readonly s3Client: S3Client,
  ) {}

  public getUploadUrl(mediaId: string, mimeType: string): Promise<string> {
    const params: PutObjectCommandInput = {
      Bucket: this.bucketName,
      Key: mediaId,
      ContentType: mimeType,
    }
    const command = new PutObjectCommand(params)
    return getSignedUrl(this.s3Client, command, { expiresIn: 60 })
  }

  public getDownloadUrl(mediaId: string): Promise<string> {
    const params: GetObjectCommandInput = {
      Bucket: this.bucketName,
      Key: mediaId,
    }
    const command = new GetObjectCommand(params)
    return getSignedUrl(this.s3Client, command, { expiresIn: 60 })
  }
}

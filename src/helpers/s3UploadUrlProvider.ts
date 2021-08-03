import AWS from 'aws-sdk'
import IUploadUrlProvider from '../interfaces/uploadUrlProvider'
import { ConsoleLogger, ILogger } from './logger'

export class S3UploadUrlProvider implements IUploadUrlProvider {
  public constructor(
    private readonly bucketName: string,
    private readonly s3Client: AWS.S3,
    private readonly logger: ILogger = new ConsoleLogger('S3UploadUrlProvider'),
  ) {}

  public async getSignedUrl(audioId: string): Promise<string> {
    const bucketParams = {
      Bucket: this.bucketName,
      Key: audioId,
      //ContentType: 'audio/webm',
      Expires: 60,
    }
    return await this.s3Client.getSignedUrlPromise('putObject', bucketParams)
  }
}

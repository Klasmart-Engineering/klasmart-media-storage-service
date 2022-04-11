import { HeadObjectCommand, S3Client } from '@aws-sdk/client-s3'

export default class MediaFileStorageChecker {
  constructor(
    private readonly s3Client: S3Client,
    private readonly bucketName: string,
  ) {}

  public async objectExists(objectKey: string): Promise<boolean | undefined> {
    try {
      await this.s3Client.send(
        new HeadObjectCommand({ Bucket: this.bucketName, Key: objectKey }),
      )
      return true
    } catch (error) {
      // https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/classes/headobjectcommand.html
      if (error instanceof Error && error.name === 'NotFound') {
        return false
      }
      // We don't know if it exists or not because a different error was thrown.
      return undefined
    }
  }
}

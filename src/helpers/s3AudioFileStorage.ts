import AWS from 'aws-sdk'
import { GetObjectRequest } from 'aws-sdk/clients/s3'
import IAudioFileStorage from '../interfaces/audioFileStorage'
import { ConsoleLogger, ILogger } from './logger'

export class S3AudioFileStorage implements IAudioFileStorage {
  public constructor(
    private readonly bucketName: string,
    private readonly s3Client: AWS.S3,
    private readonly logger: ILogger = new ConsoleLogger('S3AudioFileStorage'),
  ) {}

  public async getBase64EncryptedAudioFile(objectKey: string): Promise<string> {
    const bucketParams: GetObjectRequest = {
      Bucket: this.bucketName,
      Key: objectKey,
    }
    const result = await this.s3Client.getObject(bucketParams).promise()
    if (!result.Body) {
      throw new Error('empty body returned')
    }
    return result.Body.toString()
  }
}

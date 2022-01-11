import AWS from 'aws-sdk'
import { PutObjectRequest } from 'aws-sdk/clients/s3'
import IKeyStorage from '../interfaces/keyStorage'
import { withLogger } from 'kidsloop-nodejs-logger'

const log = withLogger('S3KeyStorage')

export class S3KeyStorage implements IKeyStorage {
  public constructor(
    private readonly bucketName: string,
    private readonly s3Client: AWS.S3,
  ) {}

  public async getKey(objectKey: string): Promise<Uint8Array | undefined> {
    const getParams: AWS.S3.Types.GetObjectRequest = {
      Bucket: this.bucketName,
      Key: objectKey,
    }
    try {
      const result = await this.s3Client.getObject(getParams).promise()
      return result.Body as Uint8Array
    } catch (e) {
      //this.logger.error(e)
    }
  }

  public async saveKey(objectKey: string, key: Uint8Array): Promise<void> {
    const putParams: PutObjectRequest = {
      Bucket: this.bucketName,
      Key: objectKey,
      Body: Buffer.from(key),
    }
    await this.s3Client.putObject(putParams).promise()
  }
}

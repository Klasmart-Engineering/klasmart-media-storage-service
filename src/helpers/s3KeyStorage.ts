import {
  GetObjectCommand,
  GetObjectCommandInput,
  PutObjectCommand,
  PutObjectCommandInput,
  S3Client,
} from '@aws-sdk/client-s3'
import IKeyStorage from '../interfaces/keyStorage'
import { withLogger } from 'kidsloop-nodejs-logger'
import s3BodyToBuffer from './s3BodyToBuffer'

const logger = withLogger('S3KeyStorage')

export class S3KeyStorage implements IKeyStorage {
  public constructor(
    private readonly bucketName: string,
    private readonly s3Client: S3Client,
  ) {}

  public async getKey(objectKey: string): Promise<Uint8Array | undefined> {
    const getParams: GetObjectCommandInput = {
      Bucket: this.bucketName,
      Key: objectKey,
    }
    try {
      const response = await this.s3Client.send(new GetObjectCommand(getParams))
      return s3BodyToBuffer(response.Body)
    } catch (e) {
      console.log(e)
      // https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/classes/getobjectcommand.html
      if (e instanceof Error && e.name === 'NoSuchKey') {
        // Object doesn't exist. Just let it return undefined.
        return
      }
      throw e
    }
  }

  public async saveKey(objectKey: string, key: Uint8Array): Promise<void> {
    const putParams: PutObjectCommandInput = {
      Bucket: this.bucketName,
      Key: objectKey,
      Body: Buffer.from(key),
    }
    await this.s3Client.send(new PutObjectCommand(putParams))
  }
}

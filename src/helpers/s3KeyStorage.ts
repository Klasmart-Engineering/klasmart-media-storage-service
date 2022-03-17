import {
  GetObjectCommand,
  GetObjectCommandInput,
  PutObjectCommand,
  PutObjectCommandInput,
  S3Client,
} from '@aws-sdk/client-s3'
import IKeyStorage from '../interfaces/keyStorage'
import { withLogger } from 'kidsloop-nodejs-logger'
import { Readable } from 'stream'

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
      const result = await this.s3Client.send(new GetObjectCommand(getParams))
      const body = result.Body as Readable
      if (!body) {
        logger.error('Expected body to be instanceof Readable.')
        return
      }
      return new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = []
        body.on('data', (chunk) => chunks.push(chunk))
        body.once('end', () => resolve(Buffer.concat(chunks)))
        body.once('error', reject)
      })
    } catch (e) {
      // Object doesn't exist. Just let it return undefined.
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

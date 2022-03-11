import AWS from 'aws-sdk'
import { Config } from '../../src/initialization/config'

const removeNulls = <S>(value: S | undefined): value is S => value != null

export async function createS3BucketsIfTheyDontExist(): Promise<void> {
  const s3Client = Config.getS3Client()
  const bucketListResult = await s3Client.listBuckets().promise()
  const buckets = (bucketListResult.Buckets ?? [])
    .map((x) => x.Name)
    .filter(removeNulls)
  if (!buckets.includes(Config.getPublicKeyBucket())) {
    await s3Client
      .createBucket({ Bucket: Config.getPublicKeyBucket() })
      .promise()
  }
  if (!buckets.includes(Config.getPrivateKeyBucket())) {
    await s3Client
      .createBucket({ Bucket: Config.getPrivateKeyBucket() })
      .promise()
  }
  if (!buckets.includes(Config.getMediaFileBucket())) {
    await s3Client
      .createBucket({ Bucket: Config.getMediaFileBucket() })
      .promise()
  }
}

export async function clearS3Buckets(s3Client: AWS.S3): Promise<void[]> {
  const bucketListResult = await s3Client.listBuckets().promise()
  const buckets = (bucketListResult.Buckets ?? [])
    .map((x) => x.Name)
    .filter(removeNulls)
  const tasks = buckets.map((bucket) => clearBucket(s3Client, bucket))
  return Promise.all(tasks)
}

async function clearBucket(s3Client: AWS.S3, bucket: string): Promise<void> {
  const objectList = await s3Client
    .listObjectsV2({
      Bucket: bucket,
    })
    .promise()
  if (!objectList.Contents || objectList.Contents.length == 0) {
    return
  }
  const objectsToDelete = objectList.Contents.map((x) => x.Key)
    .filter(removeNulls)
    .map((x) => {
      return { Key: x }
    })
  await s3Client
    .deleteObjects({
      Bucket: bucket,
      Delete: {
        Objects: objectsToDelete,
      },
    })
    .promise()
}

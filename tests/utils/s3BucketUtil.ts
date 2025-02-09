import {
  S3Client,
  ListObjectsCommand,
  ListBucketsCommand,
  DeleteObjectsCommand,
  CreateBucketCommand,
} from '@aws-sdk/client-s3'
import AppConfig from '../../src/config/config'

const removeNulls = <S>(value: S | undefined): value is S => value != null

export async function createS3BucketsIfTheyDontExist(): Promise<void> {
  const s3Client = AppConfig.default.s3Client
  const listBuckets = new ListBucketsCommand({})
  const bucketListResult = await s3Client.send(listBuckets)
  const buckets = (bucketListResult.Buckets ?? [])
    .map((x) => x.Name)
    .filter(removeNulls)
  if (!buckets.includes(AppConfig.default.publicKeyBucket)) {
    await s3Client.send(
      new CreateBucketCommand({ Bucket: AppConfig.default.publicKeyBucket }),
    )
  }
  if (!buckets.includes(AppConfig.default.privateKeyBucket)) {
    await s3Client.send(
      new CreateBucketCommand({ Bucket: AppConfig.default.privateKeyBucket }),
    )
  }
  if (!buckets.includes(AppConfig.default.mediaFileBucket)) {
    await s3Client.send(
      new CreateBucketCommand({ Bucket: AppConfig.default.mediaFileBucket }),
    )
  }
}

export async function clearS3Buckets(s3Client: S3Client): Promise<void[]> {
  const listBuckets = new ListBucketsCommand({})
  const bucketListResult = await s3Client.send(listBuckets)
  const buckets = (bucketListResult.Buckets ?? [])
    .map((x) => x.Name)
    .filter(removeNulls)
  const tasks = buckets.map((bucket) => clearBucket(s3Client, bucket))
  return Promise.all(tasks)
}

async function clearBucket(s3Client: S3Client, bucket: string): Promise<void> {
  const listObjects = new ListObjectsCommand({
    Bucket: bucket,
  })
  const objectList = await s3Client.send(listObjects)
  if (!objectList.Contents || objectList.Contents.length == 0) {
    return
  }
  const objectsToDelete = objectList.Contents.map((x) => x.Key)
    .filter(removeNulls)
    .map((x) => {
      return { Key: x }
    })
  const deleteObjects = new DeleteObjectsCommand({
    Bucket: bucket,
    Delete: {
      Objects: objectsToDelete,
    },
  })
  await s3Client.send(deleteObjects)
}

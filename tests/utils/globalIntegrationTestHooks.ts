import { createS3BucketsIfTheyDontExist } from './s3BucketUtil'

before(async () => {
  await createS3BucketsIfTheyDontExist()
})

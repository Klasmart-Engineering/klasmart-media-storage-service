import dotenv from 'dotenv'
import { createS3BucketsIfTheyDontExist } from './s3BucketUtil'
dotenv.config({ path: '.env.test' })

before(async () => {
  await createS3BucketsIfTheyDontExist()
})

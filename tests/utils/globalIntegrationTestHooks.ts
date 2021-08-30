import dotenv from 'dotenv'
import { createS3BucketsIfTheyDontExist } from './s3BucketUtil'
dotenv.config({ path: process.env.CI ? '.env.test.ci' : '.env.test' })

before(async () => {
  await createS3BucketsIfTheyDontExist()
})

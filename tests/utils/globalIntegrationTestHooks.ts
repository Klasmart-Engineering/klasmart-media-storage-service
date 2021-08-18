import dotenv from 'dotenv'
import { createS3BucketsIfTheyDontExist } from './s3BucketUtil'
import { Config } from '../../src/helpers/config'
import { createMetadataDatabaseIfItDoesntExist } from '../../src/helpers/connectToMetadataDatabase'
import { ConsoleLogger } from '../../src/helpers/logger'
dotenv.config({ path: '.env.test' })

before(async () => {
  await createMetadataDatabaseIfItDoesntExist(
    Config.getMetadataDatabaseUrl(),
    new ConsoleLogger(),
  )
  await createS3BucketsIfTheyDontExist()
})

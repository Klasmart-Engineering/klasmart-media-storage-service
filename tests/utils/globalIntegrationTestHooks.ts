import path from 'path'
import dotenv from 'dotenv'
import { Connection, createConnection } from 'typeorm'
import { createS3BucketsIfTheyDontExist } from './s3BucketUtil'
import { Config } from '../../src/helpers/config'
dotenv.config({ path: path.resolve(__dirname, '.env.test') })

before(async () => {
  await createAudioMetadataDbIfItDoesntExist()
  await createS3BucketsIfTheyDontExist()
})

async function createAudioMetadataDbIfItDoesntExist(): Promise<void> {
  const connection = await createBootstrapPostgresConnection()
  const queryRunner = connection.createQueryRunner()
  if (
    (
      await connection.query(
        "SELECT datname FROM pg_catalog.pg_database WHERE datname = 'test_audio_db';",
      )
    ).length == 0
  ) {
    await connection.query('CREATE DATABASE test_audio_db;')
  }

  await queryRunner.release()
  await connection.close()
}

const createBootstrapPostgresConnection = (): Promise<Connection> => {
  const wholeUrl = new URL(Config.getMetadataDatabaseUrl())
  // Remove the database component so it connects to the default 'postgres' database.
  wholeUrl.pathname = ''
  const url = wholeUrl.toString()
  return createConnection({
    type: 'postgres',
    url,
  })
}

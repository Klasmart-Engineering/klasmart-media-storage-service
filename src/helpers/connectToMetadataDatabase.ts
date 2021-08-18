import path from 'path'
import { Connection, ConnectionOptions, createConnection } from 'typeorm'
import { ConsoleLogger, ILogger } from './logger'

export function getMetadataDatabaseConnectionOptions(
  url: string,
): ConnectionOptions {
  return {
    type: 'postgres',
    url,
    synchronize: true,
    entities: [
      path.join(__dirname, '../entities/*.ts'),
      path.join(__dirname, '../entities/*.js'),
    ],
  }
}

export async function connectToMetadataDatabase(
  url: string,
  logger: ILogger = new ConsoleLogger(),
): Promise<Connection> {
  try {
    await createMetadataDatabaseIfItDoesntExist(url, logger)
    const connection = await createConnection(
      getMetadataDatabaseConnectionOptions(url),
    )
    logger.info('🐘 Connected to postgres: Metadata database')
    return connection
  } catch (e) {
    logger.error(
      '❌ Failed to connect or initialize postgres: Metadata database',
    )
    throw e
  }
}

export async function createMetadataDatabaseIfItDoesntExist(
  url: string,
  logger: ILogger,
): Promise<void> {
  const urlObject = new URL(url)
  // Use substring to omit the leading slash from the name.
  const databaseName = urlObject.pathname.substring(1)
  const connection = await createBootstrapPostgresConnection(urlObject)
  if (
    (
      await connection.query(
        `SELECT datname FROM pg_catalog.pg_database WHERE datname = '${databaseName}';`,
      )
    ).length == 0
  ) {
    logger.info(`database '${databaseName}' doesn't exist. Creating now...`)
    await connection.query(`CREATE DATABASE ${databaseName};`)
    logger.info(`database '${databaseName}' created successfully`)
  }

  await connection.close()
}

const createBootstrapPostgresConnection = (
  urlObject: URL,
): Promise<Connection> => {
  // Remove the database component so it connects to the default 'postgres' database.
  urlObject.pathname = ''
  const url = urlObject.toString()
  return createConnection({
    type: 'postgres',
    url,
  })
}

import path from 'path'
import {
  Connection,
  ConnectionOptions,
  createConnection,
  LoggerOptions,
} from 'typeorm'
import { withLogger } from 'kidsloop-nodejs-logger'
import delay from '../helpers/delay'

const logger = withLogger('connectToMetadataDatabase')

export type ConnectionFactory = (
  options: ConnectionOptions,
) => Promise<Connection>

export function getMetadataDatabaseConnectionOptions(
  url: string,
): ConnectionOptions {
  return {
    type: 'postgres',
    url,
    synchronize: false,
    entities: [
      path.join(__dirname, '../entities/*.ts'),
      path.join(__dirname, '../entities/*.js'),
    ],
    migrations: [path.join(__dirname, '../migrations/*.{ts,js}')],
    logging: getLogging(),
    migrationsTableName: 'migrations',
    migrationsRun: true,
    cli: {
      migrationsDir: 'src/migrations',
    },
  }
}

function getLogging(): LoggerOptions | undefined {
  const dbLogging = process.env.DATABASE_LOGGING
  if (!dbLogging) {
    return undefined
  }
  if (dbLogging === 'all') {
    return 'all'
  }
  return dbLogging.split(' ').filter((x) => x !== '') as LoggerOptions
}

export async function connectToMetadataDatabase(
  url: string,
  createIfDoesntExist = true,
  connectionFactory: ConnectionFactory = createConnection,
): Promise<Connection> {
  try {
    const connection = await connectionFactory(
      getMetadataDatabaseConnectionOptions(url),
    )
    logger.info('🐘 Connected to postgres: Metadata database')
    return connection
  } catch (e: any) {
    if (createIfDoesntExist && e.code === INVALID_CATALOG_NAME) {
      logger.info(`${e.message}. Attempting to create now...`)
      const success = await tryCreateMetadataDatabase(url, connectionFactory)
      if (!success) {
        // Another instance already created (or is in the process of creating)
        // the missing database. Let's wait a bit to give it time to finish.
        await delay(1000)
      }
      return connectToMetadataDatabase(url, false, connectionFactory)
    }
    logger.error(
      `❌ Failed to connect or initialize postgres: Metadata database: ${e.message}`,
    )
    throw e
  }
}

async function tryCreateMetadataDatabase(
  url: string,
  connectionFactory: (options: ConnectionOptions) => Promise<Connection>,
): Promise<boolean> {
  const urlObject = new URL(url)
  // Use substring to omit the leading slash from the name e.g. /media_db
  const databaseName = urlObject.pathname.substring(1)
  try {
    const connection = await createBootstrapPostgresConnection(
      urlObject,
      connectionFactory,
    )
    await connection.query(`CREATE DATABASE ${databaseName};`)
    logger.info(`database '${databaseName}' created successfully`)
    await connection.close()
    return true
  } catch (e: any) {
    // We expect one of the following two errors to occur the first time
    // this service is deployed in a new environment because all instances will try
    // to create the missing database at the same time, but only one will succeed.
    if (e.code === UNIQUE_VIOLATION || e.code === DUPLICATE_DATABASE) {
      logger.info(
        `Failed to create '${databaseName}' database (expected error): ${e.message}`,
      )
    } else if (e.code === INVALID_CATALOG_NAME) {
      throw new Error(
        `Failed to create ${databaseName} database: Tried to connect to the default ` +
          `'postgres' database to bootstrap the creation, but it doesn't exist.\n${e.message}`,
      )
    } else {
      throw new Error(
        `Failed to create ${databaseName} database (unexpected error): ${e.message}`,
      )
    }
    return false
  }
}

const createBootstrapPostgresConnection = (
  urlObject: URL,
  connectionFactory: (options: ConnectionOptions) => Promise<Connection>,
): Promise<Connection> => {
  urlObject.pathname = '/postgres'
  const url = urlObject.toString()
  return connectionFactory({
    type: 'postgres',
    url,
  })
}

// https://www.postgresql.org/docs/current/errcodes-appendix.html

/**
 * Occurs when attempting to connect to a database that doesn't exist.
 */
export const INVALID_CATALOG_NAME = '3D000'

/**
 * Occurs when attempting to create a database that already exists.
 */
export const DUPLICATE_DATABASE = '42P04'

/**
 * Occurs when attempting to create or connect to a database while it's
 * in the middle of being created by another process.
 */
export const UNIQUE_VIOLATION = '23505'

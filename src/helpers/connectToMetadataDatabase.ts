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

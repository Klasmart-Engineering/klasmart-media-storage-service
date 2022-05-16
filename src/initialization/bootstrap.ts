import buildDefaultSchema from './buildDefaultSchema'
import CompositionRoot from './compositionRoot'
import createApolloExpressService from './createApolloExpressService'
import createMercuriusService from './createMercuriusService'
import IMediaStorageService from '../interfaces/mediaStorageService'
import { withLogger } from '@kl-engineering/kidsloop-nodejs-logger'
import { error2Obj } from '../errors/errorUtil'

const logger = withLogger('bootstrap')

export default async function bootstrap(compositionRoot: CompositionRoot) {
  await compositionRoot.buildObjectGraph()
  const schema = await buildDefaultSchema(compositionRoot)

  let service: IMediaStorageService
  if (process.env.SERVER_IMPL === 'apollo-express') {
    logger.info('Using Express + Apollo')
    service = await createApolloExpressService(schema, compositionRoot)
  } else {
    logger.info('Using Fastify + Mercurius')
    service = await createMercuriusService(schema, compositionRoot)
  }

  exitEvents.forEach((event) =>
    process.on(event, async () => {
      logger.debug(`Received ${event} event.`)
      await exitHandler(compositionRoot)
    }),
  )

  return service
}

async function exitHandler(compositionRoot: CompositionRoot) {
  await compositionRoot.shutDown()
  process.exit(0)
}

const exitEvents = ['beforeExit', 'SIGINT', 'SIGTERM']

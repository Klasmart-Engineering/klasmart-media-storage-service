import buildDefaultSchema from './buildDefaultSchema'
import { CompositionRoot } from './compositionRoot'
import createApolloExpressService from './createApolloExpressService'
import createMercuriusService from './createMercuriusService'
import IMediaStorageService from '../interfaces/mediaStorageService'
import { withLogger } from 'kidsloop-nodejs-logger'

const logger = withLogger('bootstrap')

export default async function bootstrap(compositionRoot?: CompositionRoot) {
  compositionRoot ??= new CompositionRoot()
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
  return service
}

import buildDefaultSchema from './buildDefaultSchema'
import { CompositionRoot } from './compositionRoot'
import createApolloExpressService from './createApolloExpressService'
import createMercuriusService from './createMercuriusService'
import IMediaStorageService from '../interfaces/mediaStorageService'

export default async function bootstrap(compositionRoot?: CompositionRoot) {
  compositionRoot ??= new CompositionRoot()
  await compositionRoot.buildObjectGraph()
  const schema = await buildDefaultSchema(compositionRoot)

  let service: IMediaStorageService
  if (process.env.SERVER_IMPL === 'apollo-express') {
    console.log('apollo')
    service = await createApolloExpressService(schema)
  } else {
    console.log('mercurius')
    service = await createMercuriusService(schema)
  }
  return service
}

import buildDefaultSchema from './buildDefaultSchema'
import { CompositionRoot } from './compositionRoot'
import createMediaStorageServer from './createMediaStorageServer'

export async function bootstrapService(compositionRoot?: CompositionRoot) {
  compositionRoot ??= new CompositionRoot()
  await compositionRoot.buildObjectGraph()
  const schema = await buildDefaultSchema(compositionRoot)
  const { app, server } = await createMediaStorageServer(schema)
  return { app, server }
}

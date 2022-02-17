import buildDefaultSchema from './buildDefaultSchema'
import { CompositionRoot } from './compositionRoot'
import createAudioServer from './createAudioServer'

export async function bootstrapAudioService(compositionRoot?: CompositionRoot) {
  compositionRoot ??= new CompositionRoot()
  await compositionRoot.buildObjectGraph()
  const schema = await buildDefaultSchema(compositionRoot)
  const { app, server } = await createAudioServer(schema)
  return { app, server }
}

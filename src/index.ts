import 'newrelic'
import 'reflect-metadata'
import { Config } from './initialization/config'
import { connectToMetadataDatabase } from './initialization/connectToMetadataDatabase'
import createAudioServer from './initialization/createAudioServer'
import { withLogger } from 'kidsloop-nodejs-logger'

const log = withLogger('index')

async function main() {
  const { app, server } = await createAudioServer()
  await connectToMetadataDatabase(Config.getMetadataDatabaseUrl())

  const port = process.env.PORT || 8081
  app.listen(port, () => {
    log.info(`🌎 Server ready at http://localhost:${port}${server.graphqlPath}`)
  })
}

main().catch((e) => {
  const message = e instanceof Error ? e.stack : e
  log.error(`Error initializing application: ${message}`)
  process.exit(-1)
})

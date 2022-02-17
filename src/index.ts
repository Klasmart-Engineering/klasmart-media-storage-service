import 'newrelic'
import 'reflect-metadata'
import { withLogger } from 'kidsloop-nodejs-logger'
import { bootstrapAudioService } from './initialization/bootstrapper'

const log = withLogger('index')

async function main() {
  const { app, server } = await bootstrapAudioService()

  const port = process.env.PORT || 8080
  app.listen(port, () => {
    log.info(`🌎 Server ready at http://localhost:${port}${server.graphqlPath}`)
  })
}

main().catch((e) => {
  const message = e instanceof Error ? e.stack : e
  log.error(`Error initializing application: ${message}`)
  process.exit(-1)
})

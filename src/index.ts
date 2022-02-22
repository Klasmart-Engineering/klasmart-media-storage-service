import 'newrelic'
import 'reflect-metadata'
import { withLogger } from 'kidsloop-nodejs-logger'
import { bootstrapAudioService } from './initialization/bootstrapper'

const logger = withLogger('index')

async function main() {
  const { app, server } = await bootstrapAudioService()

  const port = process.env.PORT || 8080
  app.listen(port, () => {
    logger.info(
      `🌎 Server ready at http://localhost:${port}${server.graphqlPath}`,
    )
  })
}

main().catch((e) => {
  const message = e instanceof Error ? e.stack : e
  logger.error(`Error initializing application: ${message}`)
  process.exit(-1)
})

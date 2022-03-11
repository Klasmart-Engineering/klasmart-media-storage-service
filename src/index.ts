import 'newrelic'
import 'reflect-metadata'
import { withLogger } from 'kidsloop-nodejs-logger'
import { bootstrapService } from './initialization/bootstrapper'

const logger = withLogger('index')

async function main() {
  const { app, server } = await bootstrapService()

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

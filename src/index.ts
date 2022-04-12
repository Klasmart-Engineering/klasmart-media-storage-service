import 'newrelic'
import 'reflect-metadata'
import { withLogger } from '@kl-engineering/kidsloop-nodejs-logger'
import bootstrap from './initialization/bootstrap'

const logger = withLogger('index')

async function main() {
  const service = await bootstrap()

  const port = process.env.PORT || 8080
  await service.listen(Number(port), () => {
    logger.info(`🌎 Server ready at http://localhost:${port}${service.path}`)
  })
}

main().catch((e) => {
  const message = e instanceof Error ? e.stack : e
  logger.error(`Error initializing application: ${message}`)
  process.exit(-1)
})

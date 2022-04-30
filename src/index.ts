import 'newrelic'
import 'reflect-metadata'
import { withLogger } from '@kl-engineering/kidsloop-nodejs-logger'
import bootstrap from './initialization/bootstrap'
import error2Json from './errors/error2Json'

const logger = withLogger('index')

async function main() {
  const service = await bootstrap()

  const port = process.env.PORT || 8080
  await service.listen(Number(port), () => {
    logger.info(`🌎 Server ready at http://localhost:${port}${service.path}`)
  })
}

main().catch((error) => {
  const errorJson = error2Json(error)
  logger.error(`Error initializing application: ${errorJson}`)
  process.exit(-1)
})

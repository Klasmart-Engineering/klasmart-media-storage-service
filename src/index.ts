import 'newrelic'
import 'reflect-metadata'
import { withLogger } from '@kl-engineering/kidsloop-nodejs-logger'
import bootstrap from './initialization/bootstrap'
import { error2Obj } from './errors/errorUtil'
import CompositionRoot from './initialization/compositionRoot'

const logger = withLogger('index')

async function main() {
  const service = await bootstrap(new CompositionRoot())

  const port = process.env.PORT || 8080
  await service.listen(Number(port), () => {
    logger.info(`🌎 Server ready at http://localhost:${port}${service.path}`)
  })
}

main().catch((error) => {
  logger.error('Error initializing application.', { error: error2Obj(error) })
  process.exit(-1)
})

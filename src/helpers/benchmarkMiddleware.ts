import { MiddlewareFn } from 'type-graphql'
import { withLogger } from '@kl-engineering/kidsloop-nodejs-logger'

const logger = withLogger('Benchmark')

export const Benchmark: MiddlewareFn = async ({ info }, next) => {
  const start = Date.now()
  await next()
  const resolveTime = Date.now() - start
  logger.verbose(
    `${info.parentType.name}.${info.fieldName} [${resolveTime} ms]`,
  )
}

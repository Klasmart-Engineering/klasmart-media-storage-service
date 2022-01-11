import { MiddlewareFn } from 'type-graphql'
import { withLogger } from 'kidsloop-nodejs-logger'

const log = withLogger('Benchmark')

export const Benchmark: MiddlewareFn = async ({ info }, next) => {
  const start = Date.now()
  await next()
  const resolveTime = Date.now() - start
  log.verbose(`${info.parentType.name}.${info.fieldName} [${resolveTime} ms]`)
}

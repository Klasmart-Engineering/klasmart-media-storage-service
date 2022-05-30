import { withLogger } from '@kl-engineering/kidsloop-nodejs-logger'
import AppConfig from '../config/config'
import { GraphQLSchema } from 'graphql'
import Fastify, { FastifyReply, FastifyRequest, LogLevel } from 'fastify'
import mercurius, { MercuriusContext } from 'mercurius'
import cors from 'fastify-cors'
import compression from 'fastify-compress'
import healthcheck from 'fastify-healthcheck'
import helmet from '@fastify/helmet'
import IMediaStorageService from '../interfaces/mediaStorageService'
import { posix } from 'path'
import getContext from './getContext'
import getCorsOptions from '../config/getCorsOptions'
import { error2Obj } from '../errors/errorUtil'
import CompositionRoot from './compositionRoot'
import { ExecutionResult } from 'graphql'
import { version } from '../../package.json'

const logger = withLogger('createMercuriusService')

export default async function createMercuriusService(
  schema: GraphQLSchema,
  compositionRoot: CompositionRoot,
): Promise<IMediaStorageService> {
  const domain = AppConfig.default.corsDomain
  const routePrefix = process.env.ROUTE_PREFIX || ''

  const app = Fastify({ bodyLimit: 1048576 }) // (1MiB)

  app.register(healthcheck)
  app.register(compression)
  app.register(cors, getCorsOptions(domain))
  app.register(helmet, {
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false,
  })
  const versionPath = posix.join(routePrefix, '/version')
  app.get(versionPath, function (request, reply) {
    reply.send({ version })
  })

  const tokenParser = compositionRoot.getTokenParser()

  app.register(mercurius, {
    schema,
    jit: 1,
    prefix: routePrefix,
    // TODO: Move to Config file.
    ide: process.env.NODE_ENV !== 'production',
    logLevel: process.env.MERCURIUS_LOG_LEVEL as LogLevel,
    context: async (request: FastifyRequest, reply: FastifyReply) => {
      return getContext(request.headers, tokenParser)
    },
    errorFormatter,
  })

  await app.ready()

  return {
    server: app.server,
    path: posix.join(routePrefix, '/graphql'),
    listen: async (port: number, callback: () => void) => {
      await app.listen(port, '0.0.0.0')
      callback()
    },
    close: () => app.close(),
  }
}

export const errorFormatter = <TContext = MercuriusContext>(
  executionResult: ExecutionResult<
    { [key: string]: unknown },
    { [key: string]: unknown }
  >,
  context: TContext,
) => {
  if (executionResult.errors) {
    const parsedErrors = executionResult.errors.map((x) =>
      error2Obj(x.originalError),
    )
    logger.error(parsedErrors)
  }
  const formattedError = mercurius.defaultErrorFormatter(
    executionResult,
    context,
  )
  return formattedError
}

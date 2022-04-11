import { withLogger } from 'kidsloop-nodejs-logger'
import Config from './config'
import { GraphQLSchema } from 'graphql'
import Fastify, { FastifyReply, FastifyRequest, LogLevel } from 'fastify'
import mercurius from 'mercurius'
import cors from 'fastify-cors'
import compression from 'fastify-compress'
import healthcheck from 'fastify-healthcheck'
import IMediaStorageService from '../interfaces/mediaStorageService'
import { posix } from 'path'
import getContext from './getContext'
import getCorsOptions from './getCorsOptions'
import error2Json from '../errors/error2Json'
import CompositionRoot from './compositionRoot'

const logger = withLogger('createMercuriusService')

const routePrefix = process.env.ROUTE_PREFIX || ''

export default async function createMercuriusService(
  schema: GraphQLSchema,
  compositionRoot: CompositionRoot,
): Promise<IMediaStorageService> {
  const domain = Config.getCorsDomain()

  const app = Fastify({ bodyLimit: 1048576 }) // (1MiB)

  app.register(healthcheck)
  app.register(compression)
  app.register(cors, getCorsOptions(domain))

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
    errorFormatter: (error, ...args) => {
      if (error.errors) {
        const stringifiedErrors = error.errors.map((x) =>
          error2Json(x.originalError),
        )
        logger.error(stringifiedErrors)
      }
      const formattedError = mercurius.defaultErrorFormatter(error, ...args)
      return formattedError
    },
  })

  await app.ready()

  return {
    server: app.server,
    path: posix.join(routePrefix, '/graphql'),
    listen: async (port: number, callback: () => void) => {
      await app.listen(port, '0.0.0.0')
      callback()
    },
  }
}

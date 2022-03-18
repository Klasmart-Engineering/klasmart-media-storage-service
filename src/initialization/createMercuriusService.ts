import { withLogger } from 'kidsloop-nodejs-logger'
import { Config } from './config'
import { GraphQLSchema } from 'graphql'
import Fastify, { FastifyReply, FastifyRequest, LogLevel } from 'fastify'
import mercurius from 'mercurius'
import cors from 'fastify-cors'
import compression from 'fastify-compress'
import healthcheck from 'fastify-healthcheck'
import IMediaStorageService from '../interfaces/mediaStorageService'
import { posix } from 'path'
import getContext from './getContext'
import { getCorsOptions } from './getCorsOptions'

const logger = withLogger('createMercuriusServer')

const routePrefix = process.env.ROUTE_PREFIX || ''

export default async function createMercuriusServer(
  schema: GraphQLSchema,
): Promise<IMediaStorageService> {
  const domain = Config.getCorsDomain()

  const app = Fastify({ bodyLimit: 1048576 }) // (1MiB)

  app.register(healthcheck)
  app.register(compression)
  app.register(cors, getCorsOptions(domain))

  app.register(mercurius, {
    schema,
    jit: 1,
    prefix: routePrefix,
    // TODO: Move to Config file.
    ide: process.env.NODE_ENV !== 'production',
    logLevel: process.env.MERCURIUS_LOG_LEVEL as LogLevel,
    context: async (request: FastifyRequest, reply: FastifyReply) => {
      return getContext(request.headers, request.ip)
    },
  })

  await app.ready()

  return {
    server: app.server,
    path: posix.join(routePrefix, '/graphql'),
    listen: async (port: number, callback: () => void) => {
      await app.listen(port)
      callback()
    },
  }
}

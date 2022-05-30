import compression from 'compression'
import cookieParser from 'cookie-parser'
import express from 'express'
import { createApolloServer } from './createApolloServer'
import { withLogger } from '@kl-engineering/kidsloop-nodejs-logger'
import getCorsOptions from '../config/getCorsOptions'
import AppConfig from '../config/config'
import { GraphQLSchema } from 'graphql'
import IMediaStorageService from '../interfaces/mediaStorageService'
import cors from 'cors'
import CompositionRoot from './compositionRoot'
import { Server } from 'http'
import { posix } from 'path'

const logger = withLogger('createApolloExpressService')

export default async function createApolloExpressService(
  schema: GraphQLSchema,
  compositionRoot: CompositionRoot,
): Promise<IMediaStorageService> {
  const server = createApolloServer(schema, compositionRoot)
  await server.start()

  const domain = AppConfig.default.corsDomain
  const routePrefix = process.env.ROUTE_PREFIX || ''

  const app = express()
  app.use(compression())
  app.use(cookieParser())
  app.use(cors(getCorsOptions(domain)))
  app.use(express.json({ limit: '1mb' }))
  app.use(express.urlencoded({ limit: '1mb', extended: true }))
  const graphqlPath = posix.join(routePrefix, '/graphql')
  server.applyMiddleware({
    app,
    disableHealthCheck: true,
    cors: false,
    path: graphqlPath,
  })
  app.get('/health', (req, res) => {
    res.sendStatus(200)
  })
  const versionPath = posix.join(routePrefix, '/version')
  app.get(versionPath, (req, res) => {
    res.send({ version: process.env.npm_package_version })
  })

  let connection: Server
  return {
    server: app,
    path: server.graphqlPath,
    listen: async (port: number, callback: () => void) => {
      await new Promise((resolve, reject) => {
        connection = app.listen(port, () => resolve({}))
      })
      callback()
    },
    close: async () => {
      connection.close()
    },
  }
}

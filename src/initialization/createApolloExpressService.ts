import compression from 'compression'
import cookieParser from 'cookie-parser'
import express from 'express'
import { createApolloServer } from './createApolloServer'
import { withLogger } from 'kidsloop-nodejs-logger'
import { getCorsOptions } from './getCorsOptions'
import { Config } from './config'
import { GraphQLSchema } from 'graphql'
import IMediaStorageService from '../interfaces/mediaStorageService'

const logger = withLogger('createApolloExpressServer')

const routePrefix = process.env.ROUTE_PREFIX || ''

export default async function createApolloExpressServer(
  schema: GraphQLSchema,
): Promise<IMediaStorageService> {
  const server = createApolloServer(schema)
  await server.start()

  const domain = Config.getCorsDomain()

  const app = express()
  app.use(compression())
  app.use(cookieParser())
  app.use(express.json({ limit: '1mb' }))
  app.use(express.urlencoded({ limit: '1mb', extended: true }))
  server.applyMiddleware({
    app,
    disableHealthCheck: true,
    cors: getCorsOptions(domain),
    path: routePrefix,
  })
  app.get('/health', (req, res) => {
    res.sendStatus(200)
  })

  return {
    server: app,
    path: server.graphqlPath,
    listen: async (port: number, callback: () => void) => {
      await new Promise((resolve, reject) =>
        app.listen(port, () => resolve({})),
      )
      callback()
    },
  }
}

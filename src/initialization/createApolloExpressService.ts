import compression from 'compression'
import cookieParser from 'cookie-parser'
import express from 'express'
import { createApolloServer } from './createApolloServer'
import { withLogger } from '@kl-engineering/kidsloop-nodejs-logger'
import getCorsOptions from './getCorsOptions'
import Config from './config'
import { GraphQLSchema } from 'graphql'
import IMediaStorageService from '../interfaces/mediaStorageService'
import cors from 'cors'
import CompositionRoot from './compositionRoot'

const logger = withLogger('createApolloExpressService')

const routePrefix = process.env.ROUTE_PREFIX || ''

export default async function createApolloExpressService(
  schema: GraphQLSchema,
  compositionRoot: CompositionRoot,
): Promise<IMediaStorageService> {
  const server = createApolloServer(schema, compositionRoot)
  await server.start()

  const domain = Config.getCorsDomain()

  const app = express()
  app.use(compression())
  app.use(cookieParser())
  app.use(cors(getCorsOptions(domain)))
  app.use(express.json({ limit: '1mb' }))
  app.use(express.urlencoded({ limit: '1mb', extended: true }))
  server.applyMiddleware({
    app,
    disableHealthCheck: true,
    cors: false,
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

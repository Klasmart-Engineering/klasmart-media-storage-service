import compression from 'compression'
import cookieParser from 'cookie-parser'
import express from 'express'
import buildDefaultSchema from './buildDefaultSchema'
import { createApolloServer } from './createApolloServer'
import { Express } from 'express'
import { ApolloServer } from 'apollo-server-express'

const routePrefix = process.env.ROUTE_PREFIX || ''

export default async function createAudioServer(): Promise<{
  app: Express
  server: ApolloServer
}> {
  const schema = await buildDefaultSchema()
  const server = createApolloServer(schema)
  await server.start()

  const app = express()
  app.use(compression())
  app.use(cookieParser())
  app.use(express.json({ limit: '1mb' }))
  app.use(express.urlencoded({ limit: '1mb', extended: true }))
  server.applyMiddleware({
    app,
    path: routePrefix,
  })
  return { app, server }
}

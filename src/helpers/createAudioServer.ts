import compression from 'compression'
import cookieParser from 'cookie-parser'
import express from 'express'
import buildDefaultSchema from './buildDefaultSchema'
import { createApolloServer } from './createApolloServer'
import { Express } from 'express'
import { ApolloServer } from 'apollo-server-express'
import { CorsOptions } from 'cors'

const routePrefix = process.env.ROUTE_PREFIX || ''

export default async function createAudioServer(): Promise<{
  app: Express
  server: ApolloServer
}> {
  const schema = await buildDefaultSchema()
  const server = createApolloServer(schema)
  await server.start()

  // TODO: Replace fallback domain with empty string when Terraform code gets added.
  const domain = process.env.DOMAIN || 'alpha.kidsloop.net'
  if (!domain) {
    throw Error('The DOMAIN environment variable was not set')
  }
  const domainRegex = new RegExp(
    `^http(s)?://(.*\\.)?${escapeRegex(domain)}(:\\d{1,5})?$`,
  )

  const corsOptions: CorsOptions = {
    allowedHeaders: ['Authorization', 'Content-Type', 'live-authorization'],
    credentials: true,
    origin: (origin, callback) => {
      try {
        if (!origin) {
          callback(null, false)
          return
        }
        const match = origin.match(domainRegex)
        callback(null, Boolean(match))
      } catch (e: any) {
        console.error(e)
        callback(e)
      }
    },
  }

  const app = express()
  app.use(compression())
  app.use(cookieParser())
  app.use(express.json({ limit: '1mb' }))
  app.use(express.urlencoded({ limit: '1mb', extended: true }))
  server.applyMiddleware({
    app,
    cors: corsOptions,
    path: routePrefix,
  })
  return { app, server }
}

function escapeRegex(s: string) {
  return s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
}

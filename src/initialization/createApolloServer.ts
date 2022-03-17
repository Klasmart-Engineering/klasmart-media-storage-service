import { ApolloServer, ExpressContext } from 'apollo-server-express'
import { GraphQLSchema } from 'graphql'
import { Context } from '../auth/context'
import {
  ApolloServerPluginLandingPageGraphQLPlayground,
  ApolloServerPluginLandingPageDisabled,
} from 'apollo-server-core'
import { withLogger } from 'kidsloop-nodejs-logger'
import getContext from './getContext'

const logger = withLogger('createApolloServer')

export const createApolloServer = (schema: GraphQLSchema): ApolloServer => {
  return new ApolloServer({
    schema,
    plugins: [
      process.env.NODE_ENV === 'production'
        ? ApolloServerPluginLandingPageDisabled()
        : ApolloServerPluginLandingPageGraphQLPlayground({
            settings: {
              'request.credentials': 'include',
            },
          }),
    ],
    context: ({ req }: ExpressContext): Promise<Context | undefined> => {
      return getContext(req.headers, req.ip)
    },
  })
}

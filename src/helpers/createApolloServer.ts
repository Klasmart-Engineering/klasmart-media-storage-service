import { ApolloServer, ExpressContext } from 'apollo-server-express'
import { GraphQLSchema } from 'graphql'
import { Context } from '../auth/context'
import { ApolloServerPluginLandingPageGraphQLPlayground } from 'apollo-server-core'
import {
  checkAuthenticationToken,
  checkLiveAuthorizationToken,
} from 'kidsloop-token-validation'

function validateHeader(headers?: string | string[]): string | undefined {
  if (typeof headers === 'string') {
    return headers
  }
  if (headers instanceof Array && headers.length > 0) {
    return headers[0]
  }
  return undefined
}

export const createApolloServer = (schema: GraphQLSchema): ApolloServer => {
  return new ApolloServer({
    schema,
    plugins: [
      ApolloServerPluginLandingPageGraphQLPlayground({
        settings: {
          'request.credentials': 'include',
        },
      }),
    ],
    introspection: true,
    context: async ({ req }: ExpressContext): Promise<Context | undefined> => {
      try {
        const ip = (req.headers['x-forwarded-for'] || req.ip) as string
        //Authentication (userId)
        const encodedAuthenticationToken =
          validateHeader(req.headers.authentication) || req.cookies.access
        const authenticationToken = await checkAuthenticationToken(
          encodedAuthenticationToken,
        )
        const userId = authenticationToken.id

        //Live Authorization (roomId from live)
        const encodedLiveAuthorizationToken = validateHeader(
          req.headers['live-authorization'],
        )
        const authorizationToken = await checkLiveAuthorizationToken(
          encodedLiveAuthorizationToken,
        )
        const roomId =
          authorizationToken.userid === userId
            ? authorizationToken.roomid
            : undefined

        return {
          authenticationToken,
          ip,
          userId,
          roomId,
        }
      } catch (e) {
        // Don't log anything. Token validation errors just clutter the logs.
      }
    },
  })
}

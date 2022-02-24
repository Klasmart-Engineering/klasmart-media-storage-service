import { ApolloServer, ExpressContext } from 'apollo-server-express'
import { GraphQLSchema } from 'graphql'
import { Context } from '../auth/context'
import {
  ApolloServerPluginLandingPageGraphQLPlayground,
  ApolloServerPluginLandingPageDisabled,
} from 'apollo-server-core'
import {
  checkAuthenticationToken,
  checkLiveAuthorizationToken,
} from 'kidsloop-token-validation'
import { withLogger } from 'kidsloop-nodejs-logger'

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
    context: async ({ req }: ExpressContext): Promise<Context | undefined> => {
      try {
        const ip = (req.headers['x-forwarded-for'] || req.ip) as string
        const encodedAuthenticationToken =
          extractHeader(req.headers.authentication) || req.cookies.access
        if (encodedAuthenticationToken == null) {
          return { ip }
        }
        const authenticationToken = await checkAuthenticationToken(
          encodedAuthenticationToken,
        )
        const userId = authenticationToken.id

        let roomId: string | undefined
        const encodedLiveAuthorizationToken = extractHeader(
          req.headers['live-authorization'],
        )
        if (encodedLiveAuthorizationToken != null) {
          try {
            const authorizationToken = await checkLiveAuthorizationToken(
              encodedLiveAuthorizationToken,
            )
            roomId =
              authorizationToken.userid === userId
                ? authorizationToken.roomid
                : undefined
            if (roomId === undefined) {
              logger.error(
                `[context] authenticationToken.userId (${userId}) is different than authorizationToken.userId (${authorizationToken.userid}).`,
              )
            }
          } catch (e) {
            // Don't log anything. Token validation errors just clutter the logs.
          }
        }

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

function extractHeader(headers?: string | string[]): string | undefined {
  if (typeof headers === 'string') {
    return headers
  }
  if (headers instanceof Array && headers.length > 0) {
    return headers[0]
  }
  return undefined
}

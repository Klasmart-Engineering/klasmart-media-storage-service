import { ApolloServer, ExpressContext } from 'apollo-server-express'
import { GraphQLSchema } from 'graphql'
import { Context } from '../auth/context'
import { ApolloServerPluginLandingPageGraphQLPlayground } from 'apollo-server-core'
import {
  checkAuthenticationToken,
  checkLiveAuthorizationToken,
} from 'kidsloop-token-validation'

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
        // Authentication (userId)
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
        // Live Authorization (roomId from live)
        const encodedLiveAuthorizationToken = extractHeader(
          req.headers['live-authorization'],
        )
        if (encodedLiveAuthorizationToken != null) {
          console.log(
            'encodedLiveAuthorizationToken:',
            encodedLiveAuthorizationToken,
          )
          try {
            const authorizationToken = await checkLiveAuthorizationToken(
              encodedLiveAuthorizationToken,
            )
            console.log('authorizationToken.userid:', authorizationToken.userid)
            console.log('authorizationToken.roomid:', authorizationToken.roomid)
            roomId =
              authorizationToken.userid === userId
                ? authorizationToken.roomid
                : undefined
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

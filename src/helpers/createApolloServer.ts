import { ApolloServer, ExpressContext } from 'apollo-server-express'
import { GraphQLSchema } from 'graphql'
import { Context } from '../auth/context'
import { ApolloServerPluginLandingPageGraphQLPlayground } from 'apollo-server-core'
import { checkToken } from 'kidsloop-token-validation'

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
        const encodedToken = req.headers.authorization || req.cookies.access
        const token = await checkToken(encodedToken)
        return { token, ip, userId: token.id }
        //return { token: { email: '', exp: 1, iss: '' }, userId: 'user1' }
      } catch (e) {
        // Don't log anything. Token validation errors just clutter the logs.
      }
    },
  })
}

import { ApolloServer, ExpressContext } from 'apollo-server-express'
import { GraphQLSchema } from 'graphql'
import { Context } from '../auth/context'
//import { checkToken } from 'kidsloop-token-validation'
import { ApolloServerPluginLandingPageGraphQLPlayground } from 'apollo-server-core'
import { checkToken } from '../auth/auth'

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
        if (!token.id) {
          throw new Error('token.id is undefined or empty')
        }
        return { token, ip, userId: token.id }
      } catch (e) {
        console.log(e)
      }
    },
  })
}

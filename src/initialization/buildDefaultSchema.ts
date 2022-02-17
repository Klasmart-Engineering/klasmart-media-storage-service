import path from 'path'
import { GraphQLSchema } from 'graphql'
import { buildSchema, ClassType } from 'type-graphql'
import { authChecker } from '../auth/authChecker'
import { AudioResolver } from '../resolvers/audioResolver'
import { CompositionRoot } from './compositionRoot'

export default function buildDefaultSchema(
  compositionRoot = new CompositionRoot(),
): Promise<GraphQLSchema> {
  return buildSchema({
    resolvers: [
      path.join(__dirname, '../resolvers/**/*.ts'),
      path.join(__dirname, '../resolvers/**/*.js'),
    ],
    authChecker,
    container: new CustomIocContainer(compositionRoot),
    emitSchemaFile: {
      path: path.join(__dirname, '../generatedSchema.gql'),
    },
  })
}

export class CustomIocContainer {
  public constructor(private readonly compositionRoot: CompositionRoot) {}

  async get(objectType: ClassType): Promise<unknown> {
    if (objectType === AudioResolver) {
      return await this.compositionRoot.getAudioResolver()
    }
  }
}

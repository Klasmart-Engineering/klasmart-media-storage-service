import path from 'path'
import { GraphQLSchema } from 'graphql'
import { buildSchema, ClassType } from 'type-graphql'
import { authChecker } from '../auth/authChecker'
import { AudioResolver } from '../resolvers/audioResolver'
import { CompositionRoot } from './compositionRoot'

export default function buildDefaultSchema(): Promise<GraphQLSchema> {
  return buildSchema({
    resolvers: [
      path.join(__dirname, '../resolvers/**/*.ts'),
      path.join(__dirname, '../resolvers/**/*.js'),
    ],
    authChecker,
    container: new CustomIocContainer(new CompositionRoot()),
    emitSchemaFile: {
      path: path.join(__dirname, '../generatedSchema.gql'),
    },
  })
}

class CustomIocContainer {
  private audioResolver?: AudioResolver
  public constructor(private readonly compositionRoot: CompositionRoot) {}

  get(objectType: ClassType): unknown {
    if (objectType === AudioResolver) {
      if (!this.audioResolver) {
        console.log('constructing AudioResolver')
        this.audioResolver = this.compositionRoot.constructAudioResolver()
      }
      return this.audioResolver
    }
    console.log('constructing unknown')
    return new objectType()
    //throw new Error()
  }
}

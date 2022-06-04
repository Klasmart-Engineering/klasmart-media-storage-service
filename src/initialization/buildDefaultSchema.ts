import path from 'path'
import { GraphQLSchema } from 'graphql'
import { buildSchema, ClassType } from 'type-graphql'
import DownloadResolver from '../resolvers/downloadResolver'
import CompositionRoot from './compositionRoot'
import UploadResolver from '../resolvers/uploadResolver'
import MetadataResolver from '../resolvers/metadataResolver'
import { DownloadResolverExtended } from '../resolvers/downloadResolverExtended'
import { ApplicationError } from '../errors/applicationError'

export default function buildDefaultSchema(
  compositionRoot: CompositionRoot,
): Promise<GraphQLSchema> {
  return buildSchema({
    resolvers: [
      path.join(__dirname, '../resolvers/**/*.ts'),
      path.join(__dirname, '../resolvers/**/*.js'),
    ],
    container: new CustomIocContainer(compositionRoot),
    emitSchemaFile: {
      path: path.join(__dirname, '../generatedSchema.gql'),
    },
  })
}

export class CustomIocContainer {
  public constructor(private readonly compositionRoot: CompositionRoot) {}

  get(objectType: ClassType): unknown {
    if (objectType === DownloadResolver) {
      return this.compositionRoot.getDownloadResolver()
    }
    if (objectType === MetadataResolver) {
      return this.compositionRoot.getMetadataResolver()
    }
    if (objectType === UploadResolver) {
      return this.compositionRoot.getUploadResolver()
    }
    if (objectType === DownloadResolverExtended) {
      return this.compositionRoot.getDownloadResolverExtended()
    }
    throw new ApplicationError(
      '[CustomIocContainer] Oops, you forgot to register a resolver.',
      undefined,
      { objectType },
    )
  }
}

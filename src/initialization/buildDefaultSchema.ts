import path from 'path'
import { GraphQLSchema } from 'graphql'
import { buildSchema, ClassType } from 'type-graphql'
import DownloadResolver from '../resolvers/downloadResolver'
import CompositionRoot from './compositionRoot'
import UploadResolver from '../resolvers/uploadResolver'
import MetadataResolver from '../resolvers/metadataResolver'

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

  async get(objectType: ClassType): Promise<unknown> {
    if (objectType === DownloadResolver) {
      return await this.compositionRoot.getDownloadResolver()
    }
    if (objectType === MetadataResolver) {
      return await this.compositionRoot.getMetadataResolver()
    }
    if (objectType === UploadResolver) {
      return await this.compositionRoot.getUploadResolver()
    }
  }
}

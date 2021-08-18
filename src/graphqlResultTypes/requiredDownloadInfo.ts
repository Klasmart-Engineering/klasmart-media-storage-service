import { Field, ObjectType } from 'type-graphql'

@ObjectType()
export class RequiredDownloadInfo {
  @Field()
  public base64SymmetricKey!: string

  @Field()
  public presignedUrl!: string
}

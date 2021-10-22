import { Field, ObjectType } from 'type-graphql'

@ObjectType()
export class RequiredUploadInfo {
  @Field()
  public audioId!: string

  @Field()
  public base64ServerPublicKey!: string

  @Field()
  public presignedUrl!: string
}

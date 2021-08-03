import { Field, ObjectType } from 'type-graphql'

@ObjectType()
export class RequiredUploadInfo {
  @Field()
  public base64OrgPublicKey!: string

  @Field()
  public presignedUrl!: string
}

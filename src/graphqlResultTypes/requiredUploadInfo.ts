import { Field, ObjectType } from 'type-graphql'

@ObjectType({ description: 'The info required to upload an audio file.' })
export class RequiredUploadInfo {
  @Field({ description: 'A generated UUID to identify an audio file.' })
  public audioId!: string

  @Field({ description: 'A base64 encoded server public key.' })
  public base64ServerPublicKey!: string

  @Field({ description: 'A presigned upload URL.' })
  public presignedUrl!: string
}

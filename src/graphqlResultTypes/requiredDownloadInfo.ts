import { Field, ObjectType } from 'type-graphql'

@ObjectType({ description: 'The info required to download an audio file.' })
export class RequiredDownloadInfo {
  @Field({
    description:
      'A base64 encoded symmetric key. Used to decrypt the same audio file that it encrypted.',
  })
  public base64SymmetricKey!: string

  @Field({ description: 'A presigned download URL.' })
  public presignedUrl!: string
}

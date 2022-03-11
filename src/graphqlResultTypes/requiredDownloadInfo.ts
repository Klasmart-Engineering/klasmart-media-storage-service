import { Field, ObjectType } from 'type-graphql'

@ObjectType({
  simpleResolvers: true,
  description: 'The info required to download a media file.',
})
export class RequiredDownloadInfo {
  @Field({
    description:
      'A base64 encoded symmetric key. Used to decrypt the same media file that it encrypted.',
  })
  public base64SymmetricKey!: string

  @Field({ description: 'A presigned download URL.' })
  public presignedUrl!: string
}

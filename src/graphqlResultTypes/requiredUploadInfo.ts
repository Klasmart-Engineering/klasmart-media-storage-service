import { Field, ObjectType } from 'type-graphql'

@ObjectType({
  simpleResolvers: true,
  description: 'The info required to upload a media file.',
})
export class RequiredUploadInfo {
  @Field({ description: 'A generated UUID to identify a media file.' })
  public mediaId!: string

  @Field({ description: 'A presigned upload URL.' })
  public presignedUrl!: string
}

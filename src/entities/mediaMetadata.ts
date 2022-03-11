import { Field, ID, ObjectType } from 'type-graphql'
import { Column, Entity, PrimaryColumn } from 'typeorm'

@ObjectType({
  simpleResolvers: true,
  description: 'The metadata associated with an uploaded media file.',
})
@Entity()
export class MediaMetadata {
  @Field(() => ID, { description: 'The UUID that identifies this media file.' })
  @PrimaryColumn('uuid')
  public readonly id!: string

  @Field(() => String, {
    description: 'The ID of the Live room where this media was captured.',
  })
  @Column({ type: 'varchar', name: 'room_id', nullable: true })
  public readonly roomId!: string | null

  @Field(() => ID, {
    description: 'The ID of the user associated with this media.',
  })
  @Column({ type: 'uuid', name: 'user_id' })
  public readonly userId!: string

  @Field(() => String, {
    description: 'The ID of the H5P activity where this media was captured.',
  })
  @Column({ type: 'varchar', name: 'h5p_id' })
  public readonly h5pId!: string

  @Field(() => String, {
    nullable: true,
    description:
      'The ID of the H5P sub-activity where this media was captured.',
  })
  @Column({ type: 'varchar', name: 'h5p_sub_id', nullable: true })
  public readonly h5pSubId!: string | null

  @Field(() => String, {
    description: 'The description of the media context.',
  })
  @Column({ type: 'varchar' })
  public readonly description!: string

  @Field({
    description: 'The date/time when this media was captured.',
  })
  @Column({ type: 'timestamptz', name: 'created_at' })
  public readonly createdAt!: Date

  @Field({
    description: 'The mime type of the captured media.',
  })
  @Column({ type: 'varchar', name: 'mime_type' })
  public readonly mimeType!: string

  @Column({ type: 'varchar', name: 'base64_user_public_key' })
  public readonly base64UserPublicKey!: string

  @Column({ type: 'varchar', name: 'base64_encrypted_symmetric_key' })
  public readonly base64EncryptedSymmetricKey!: string
}

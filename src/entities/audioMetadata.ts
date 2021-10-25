import { Field, ID, ObjectType } from 'type-graphql'
import { Column, Entity, PrimaryColumn } from 'typeorm'

@ObjectType({
  description: 'The metadata associated with an uploaded audio file.',
})
@Entity()
export class AudioMetadata {
  @Field(() => ID, { description: 'The UUID that identifies this audio file.' })
  @PrimaryColumn('uuid')
  public readonly id!: string

  @Field(() => String, {
    description: 'The ID of the Live room where this audio was recorded.',
  })
  @Column({ type: 'varchar', nullable: true })
  public readonly roomId!: string | null

  @Field(() => ID, {
    description: 'The ID of the user that recorded this audio.',
  })
  @Column({ type: 'uuid' })
  public readonly userId!: string

  @Field(() => String, {
    description: 'The ID of the H5P activity where this audio was recorded.',
  })
  @Column({ type: 'varchar' })
  public readonly h5pId!: string

  @Field(() => String, {
    nullable: true,
    description:
      'The ID of the H5P sub-activity where this audio was recorded.',
  })
  @Column({ type: 'varchar', nullable: true })
  public readonly h5pSubId!: string | null

  @Field(() => String, {
    description: 'The description of the audio recording activity.',
  })
  @Column({ type: 'varchar' })
  public readonly description!: string

  @Field({
    description: 'The date/time when this audio was recorded.',
  })
  @Column({ type: 'timestamptz' })
  public readonly creationDate!: Date

  @Column()
  public readonly mimeType!: string

  @Column()
  public readonly base64UserPublicKey!: string

  @Column()
  public readonly base64EncryptedSymmetricKey!: string
}

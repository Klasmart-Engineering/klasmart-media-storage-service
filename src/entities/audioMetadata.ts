import { Field, ID, ObjectType } from 'type-graphql'
import { Column, Entity, PrimaryColumn } from 'typeorm'

@ObjectType()
@Entity()
export class AudioMetadata {
  @Field(() => ID)
  @PrimaryColumn('uuid')
  public readonly id!: string

  @Field(() => String)
  @Column({ type: 'varchar' })
  public readonly roomId!: string

  @Field(() => ID)
  @Column({ type: 'uuid' })
  public readonly userId!: string

  @Field(() => String)
  @Column({ type: 'varchar' })
  public readonly h5pId!: string

  @Field(() => String, { nullable: true })
  @Column({ type: 'varchar', nullable: true })
  public readonly h5pSubId!: string | null

  @Field()
  @Column()
  public readonly creationDate!: Date

  @Column()
  public readonly mimeType!: string

  @Column()
  public readonly base64UserPublicKey!: string

  @Column()
  public readonly base64EncryptedSymmetricKey!: string
}

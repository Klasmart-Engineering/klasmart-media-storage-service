import { Field, ID, ObjectType } from 'type-graphql'
import { Column, Entity, PrimaryColumn } from 'typeorm'

@ObjectType()
@Entity()
export class AudioMetadata {
  @Field(() => ID)
  @PrimaryColumn('uuid')
  public readonly id!: string

  @Field(() => String, { nullable: true })
  @Column({ type: 'varchar', nullable: true })
  public readonly roomId!: string | null

  @Field()
  @Column()
  public readonly userId!: string

  @Field(() => String, { nullable: true })
  @Column({ type: 'varchar', nullable: true })
  public readonly h5pId!: string | null

  @Field(() => String, { nullable: true })
  @Column({ type: 'varchar', nullable: true })
  public readonly h5pSubId!: string | null

  @Field()
  @Column()
  public readonly creationDate!: Date

  @Column()
  public readonly base64UserPublicKey!: string
}

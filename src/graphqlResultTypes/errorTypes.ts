import { Field, ObjectType, InterfaceType } from 'type-graphql'

@InterfaceType()
export abstract class IError {
  @Field()
  message!: string
}

@ObjectType({ implements: IError })
export class UnableToRetrieveAudioMetadata implements IError {
  @Field()
  message!: string
}

@ObjectType({ implements: IError })
export class UserDoesntExist implements IError {
  @Field()
  message!: string
}

@ObjectType({ implements: IError })
export class RoomDoesntExist implements IError {
  @Field()
  message!: string
}

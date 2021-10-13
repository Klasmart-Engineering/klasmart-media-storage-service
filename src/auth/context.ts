import { createParamDecorator } from 'type-graphql'
import { KidsloopAuthenticationToken } from 'kidsloop-token-validation'

export interface Context {
  authenticationToken?: KidsloopAuthenticationToken
  ip?: string | string[]
  userId?: string
  roomId?: string
}

export function UserID(): ParameterDecorator {
  return createParamDecorator<Context>(({ context }) => context.userId)
}

export function RoomID(): ParameterDecorator {
  return createParamDecorator<Context>(({ context }) => context.roomId)
}
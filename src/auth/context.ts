import { createParamDecorator } from 'type-graphql'

export interface Context {
  authenticationToken?: string
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

export function AuthenticationToken(): ParameterDecorator {
  return createParamDecorator<Context>(
    ({ context }): string | undefined => context.authenticationToken,
  )
}

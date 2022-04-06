export default interface ITokenParser {
  parseLiveAuthorizationToken(
    encodedLiveAuthorizationToken: string | undefined,
  ): Promise<LiveAuthorizationToken>

  parseAuthenticationToken(
    encodedAuthenticationToken: string | undefined,
  ): Promise<AuthenticationToken>
}

export type LiveAuthorizationToken = {
  roomId: string | undefined
  userId: string | undefined
}

export type AuthenticationToken = {
  userId: string | undefined
}

export default interface IAuthorizationProvider {
  isAuthorized(
    endUserId: string | undefined,
    roomId: string,
    authenticationToken: string | undefined,
  ): Promise<boolean>
}

import { withLogger } from 'kidsloop-nodejs-logger'
import IAuthorizationProvider from '../interfaces/authorizationProvider'

const logger = withLogger('AuthorizationProvider')

export default class MockAuthorizationProvider
  implements IAuthorizationProvider
{
  public async isAuthorized(
    endUserId: string | undefined,
    roomId: string | undefined,
    authenticationToken: string | undefined,
  ): Promise<boolean> {
    if (!endUserId) {
      logger.debug(`[isAuthorized] endUserId is falsy`)
      return false
    }
    if (!roomId) {
      logger.debug(`[isAuthorized] roomId is falsy`)
      return false
    }
    if (!authenticationToken) {
      logger.debug(`[isAuthorized] authenticationToken is falsy`)
      return false
    }
    return true
  }
}

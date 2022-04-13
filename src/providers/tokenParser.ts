import { withLogger } from '@kl-engineering/kidsloop-nodejs-logger'
import {
  checkAuthenticationToken,
  checkLiveAuthorizationToken,
} from '@kl-engineering/kidsloop-token-validation'
import ITokenParser, {
  AuthenticationToken,
  LiveAuthorizationToken,
} from '../interfaces/tokenParser'

const logger = withLogger('TokenParser')

export default class TokenParser implements ITokenParser {
  public async parseAuthenticationToken(
    encodedAuthenticationToken: string | undefined,
  ): Promise<AuthenticationToken> {
    if (encodedAuthenticationToken == null) {
      return { userId: undefined }
    }
    try {
      const token = await checkAuthenticationToken(encodedAuthenticationToken)
      return { userId: token.id }
    } catch (error) {
      logger.silly('[parseAuthenticationToken]', error)
    }
    return { userId: undefined }
  }

  public async parseLiveAuthorizationToken(
    encodedLiveAuthorizationToken: string | undefined,
  ): Promise<LiveAuthorizationToken> {
    if (encodedLiveAuthorizationToken == null) {
      return { userId: undefined, roomId: undefined }
    }
    try {
      const token = await checkLiveAuthorizationToken(
        encodedLiveAuthorizationToken,
      )
      return { roomId: token.roomid, userId: token.userid }
    } catch (error) {
      logger.silly('[parseLiveAuthorizationToken]', error)
    }
    return { roomId: undefined, userId: undefined }
  }
}

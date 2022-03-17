import { withLogger } from 'kidsloop-nodejs-logger'
import {
  checkAuthenticationToken,
  checkLiveAuthorizationToken,
} from 'kidsloop-token-validation'
import cookie from 'cookie'
import { Context } from '../auth/context'
import { IncomingHttpHeaders } from 'http'

const logger = withLogger('getContext')

export default async function getContext(
  headers: IncomingHttpHeaders,
  requestIp: string,
): Promise<Context | undefined> {
  try {
    const ip = (headers['x-forwarded-for'] || requestIp) as string
    const cookieHeader = headers.cookie
    const cookies = cookieHeader ? cookie.parse(cookieHeader) : undefined
    const encodedAuthenticationToken = cookies?.access
    if (encodedAuthenticationToken == null) {
      return { ip }
    }
    const authenticationToken = await checkAuthenticationToken(
      encodedAuthenticationToken,
    )
    const userId = authenticationToken.id

    let roomId: string | undefined
    const encodedLiveAuthorizationToken = extractHeader(
      headers['live-authorization'],
    )
    if (encodedLiveAuthorizationToken != null) {
      try {
        const authorizationToken = await checkLiveAuthorizationToken(
          encodedLiveAuthorizationToken,
        )
        roomId =
          authorizationToken.userid === userId
            ? authorizationToken.roomid
            : undefined
        if (roomId === undefined) {
          logger.error(
            `[context] authenticationToken.userId (${userId}) is different than authorizationToken.userId (${authorizationToken.userid}).`,
          )
        }
      } catch (e) {
        // Don't log anything. Token validation errors just clutter the logs.
      }
    }

    return {
      authenticationToken: encodedAuthenticationToken,
      ip,
      userId,
      roomId,
    }
  } catch (e) {
    // Don't log anything. Token validation errors just clutter the logs.
  }
}

function extractHeader(headers?: string | string[]): string | undefined {
  if (typeof headers === 'string') {
    return headers
  }
  if (headers instanceof Array && headers.length > 0) {
    return headers[0]
  }
  return undefined
}

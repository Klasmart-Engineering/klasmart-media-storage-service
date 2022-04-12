import { withLogger } from '@kl-engineering/kidsloop-nodejs-logger'
import cookie from 'cookie'
import { Context } from '../auth/context'
import { IncomingHttpHeaders } from 'http'
import ITokenParser from '../interfaces/tokenParser'

const logger = withLogger('getContext')

export default async function getContext(
  headers: IncomingHttpHeaders,
  tokenParser: ITokenParser,
): Promise<Context> {
  const cookieHeader = headers.cookie
  const cookies = cookieHeader ? cookie.parse(cookieHeader) : undefined
  const encodedAuthenticationToken = cookies?.access
  if (encodedAuthenticationToken == null) {
    return {}
  }
  const authenticationToken = await tokenParser.parseAuthenticationToken(
    encodedAuthenticationToken,
  )
  const encodedLiveAuthorizationToken = extractHeader(
    headers['live-authorization'],
  )
  let roomId: string | undefined
  if (encodedLiveAuthorizationToken != null) {
    const authorizationToken = await tokenParser.parseLiveAuthorizationToken(
      encodedLiveAuthorizationToken,
    )
    roomId = authorizationToken.roomId
    if (authorizationToken.userId !== authenticationToken.userId) {
      logger.error(
        `authenticationToken.userId (${authenticationToken.userId}) ` +
          `is different than authorizationToken.userId (${authorizationToken.userId}). ` +
          `The media will still be uploaded, but roomId (${roomId}) will be set to undefined.`,
      )
      roomId = undefined
    }
  }

  return {
    authenticationToken: encodedAuthenticationToken,
    userId: authenticationToken.userId,
    roomId,
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

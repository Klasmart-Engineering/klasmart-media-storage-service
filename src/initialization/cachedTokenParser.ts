import ITokenParser, {
  AuthenticationToken,
  LiveAuthorizationToken,
} from '../interfaces/tokenParser'
import { ICacheProvider } from '../interfaces/cacheProvider'

export default class CachedTokenParser implements ITokenParser {
  constructor(
    private readonly tokenParser: ITokenParser,
    private readonly cache: ICacheProvider,
  ) {}

  public async parseAuthenticationToken(
    encodedAuthenticationToken: string,
  ): Promise<AuthenticationToken> {
    const tokenJson = await this.cache.get(encodedAuthenticationToken)
    if (tokenJson) {
      return JSON.parse(tokenJson)
    }
    const token = await this.tokenParser.parseAuthenticationToken(
      encodedAuthenticationToken,
    )
    if (token.userId) {
      await this.cache.set(
        encodedAuthenticationToken,
        JSON.stringify(token),
        60,
      )
    }
    return token
  }

  public async parseLiveAuthorizationToken(
    encodedLiveAuthorizationToken: string,
  ): Promise<LiveAuthorizationToken> {
    const tokenJson = await this.cache.get(encodedLiveAuthorizationToken)
    if (tokenJson) {
      return JSON.parse(tokenJson)
    }
    const token = await this.tokenParser.parseLiveAuthorizationToken(
      encodedLiveAuthorizationToken,
    )
    if (token.userId) {
      await this.cache.set(
        encodedLiveAuthorizationToken,
        JSON.stringify(token),
        60,
      )
    }
    return token
  }
}

import ITokenParser, {
  AuthenticationToken,
  LiveAuthorizationToken,
} from '../interfaces/tokenParser'
import ICacheProvider from '../interfaces/cacheProvider'

export default class CachedTokenParser implements ITokenParser {
  public static getAuthenticationTokenCacheKey(token: string) {
    return `CachedTokenParser.parseAuthenticationToken:${token}`
  }

  public static getAuthorizationTokenCacheKey(token: string) {
    return `CachedTokenParser.parseLiveAuthorizationToken:${token}`
  }

  constructor(
    private readonly tokenParser: ITokenParser,
    private readonly cache: ICacheProvider,
  ) {}

  public async parseAuthenticationToken(
    encodedAuthenticationToken: string,
  ): Promise<AuthenticationToken> {
    const cacheKey = CachedTokenParser.getAuthenticationTokenCacheKey(
      encodedAuthenticationToken,
    )
    const tokenJson = await this.cache.get(cacheKey)
    if (tokenJson) {
      return JSON.parse(tokenJson)
    }
    const token = await this.tokenParser.parseAuthenticationToken(
      encodedAuthenticationToken,
    )
    await this.cache.set(cacheKey, JSON.stringify(token), 60)
    return token
  }

  public async parseLiveAuthorizationToken(
    encodedLiveAuthorizationToken: string,
  ): Promise<LiveAuthorizationToken> {
    const cacheKey = CachedTokenParser.getAuthorizationTokenCacheKey(
      encodedLiveAuthorizationToken,
    )
    const tokenJson = await this.cache.get(cacheKey)
    if (tokenJson) {
      return JSON.parse(tokenJson)
    }
    const token = await this.tokenParser.parseLiveAuthorizationToken(
      encodedLiveAuthorizationToken,
    )
    await this.cache.set(cacheKey, JSON.stringify(token), 60)
    return token
  }
}

import expect from '../../utils/chaiAsPromisedSetup'
import { Arg, Substitute } from '@fluffy-spoon/substitute'
import ICacheProvider from '../../../src/interfaces/cacheProvider'
import CachedTokenParser from '../../../src/caching/cachedTokenParser'
import ITokenParser, {
  AuthenticationToken,
  LiveAuthorizationToken,
} from '../../../src/interfaces/tokenParser'

describe('CachedTokenParser', () => {
  describe('parseAuthenticationToken', () => {
    context('token not cached', () => {
      it('returns expected token, and calls cache.set', async () => {
        // Arrange
        const tokenParser = Substitute.for<ITokenParser>()
        const cache = Substitute.for<ICacheProvider>()
        const sut = new CachedTokenParser(tokenParser, cache)

        const encodedAuthenticationToken = 'encoded-authentication-token'
        const endUserId = 'endUser1'
        const cacheKey = CachedTokenParser.getAuthenticationTokenCacheKey(
          encodedAuthenticationToken,
        )
        cache.get(cacheKey).resolves(null)
        const authenticationToken: AuthenticationToken = { userId: endUserId }
        tokenParser
          .parseAuthenticationToken(encodedAuthenticationToken)
          .resolves(authenticationToken)

        // Act
        const actual = await sut.parseAuthenticationToken(
          encodedAuthenticationToken,
        )

        // Assert
        const expected = authenticationToken
        expect(actual).to.deep.equal(expected)

        cache.received(1).set(cacheKey, JSON.stringify(expected), Arg.any())
      })
    })

    context('token is cached', () => {
      it('returns expected token, and does not call source', async () => {
        // Arrange
        const tokenParser = Substitute.for<ITokenParser>()
        const cache = Substitute.for<ICacheProvider>()
        const sut = new CachedTokenParser(tokenParser, cache)

        const encodedAuthenticationToken = 'encoded-authentication-token'
        const endUserId = 'endUser1'
        const cacheKey = CachedTokenParser.getAuthenticationTokenCacheKey(
          encodedAuthenticationToken,
        )
        const authenticationToken: AuthenticationToken = { userId: endUserId }
        const jsonResult = JSON.stringify(authenticationToken)
        cache.get(cacheKey).resolves(jsonResult)

        // Act
        const actual = await sut.parseAuthenticationToken(
          encodedAuthenticationToken,
        )

        // Assert
        const expected = authenticationToken
        expect(actual).to.deep.equal(expected)
        tokenParser.received(0).parseAuthenticationToken(Arg.all())
        cache.received(0).set(Arg.all())
      })
    })
  })

  describe('parseLiveAuthorizationToken', () => {
    context('token not cached', () => {
      it('returns expected token, and calls cache.set', async () => {
        // Arrange
        const tokenParser = Substitute.for<ITokenParser>()
        const cache = Substitute.for<ICacheProvider>()
        const sut = new CachedTokenParser(tokenParser, cache)

        const encodedAuthorizationToken = 'encoded-authorization-token'
        const endUserId = 'endUser1'
        const roomId = 'room1'
        const cacheKey = CachedTokenParser.getAuthorizationTokenCacheKey(
          encodedAuthorizationToken,
        )
        cache.get(cacheKey).resolves(null)
        const authorizationToken: LiveAuthorizationToken = {
          userId: endUserId,
          roomId,
        }
        tokenParser
          .parseLiveAuthorizationToken(encodedAuthorizationToken)
          .resolves(authorizationToken)

        // Act
        const actual = await sut.parseLiveAuthorizationToken(
          encodedAuthorizationToken,
        )

        // Assert
        const expected = authorizationToken
        expect(actual).to.deep.equal(expected)

        cache.received(1).set(cacheKey, JSON.stringify(expected), Arg.any())
      })
    })

    context('token is cached', () => {
      it('returns expected token, and does not call source', async () => {
        // Arrange
        const tokenParser = Substitute.for<ITokenParser>()
        const cache = Substitute.for<ICacheProvider>()
        const sut = new CachedTokenParser(tokenParser, cache)

        const encodedAuthorizationToken = 'encoded-authorization-token'
        const endUserId = 'endUser1'
        const roomId = 'room1'
        const cacheKey = CachedTokenParser.getAuthorizationTokenCacheKey(
          encodedAuthorizationToken,
        )
        const authorizationToken: LiveAuthorizationToken = {
          userId: endUserId,
          roomId,
        }
        const jsonResult = JSON.stringify(authorizationToken)
        cache.get(cacheKey).resolves(jsonResult)

        // Act
        const actual = await sut.parseLiveAuthorizationToken(
          encodedAuthorizationToken,
        )

        // Assert
        const expected = authorizationToken
        expect(actual).to.deep.equal(expected)
        tokenParser.received(0).parseLiveAuthorizationToken(Arg.all())
        cache.received(0).set(Arg.all())
      })
    })
  })
})

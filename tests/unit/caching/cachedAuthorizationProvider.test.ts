import Substitute, { Arg } from '@fluffy-spoon/substitute'
import { expect } from 'chai'
import CachedAuthorizationProvider from '../../../src/caching/cachedAuthorizationProvider'
import IAuthorizationProvider from '../../../src/interfaces/authorizationProvider'
import ICacheProvider from '../../../src/interfaces/cacheProvider'

describe('cachedAuthorizationProvider', () => {
  describe('isAuthorized', () => {
    context('cache returns true', () => {
      it('returns true, and does not call the underlying authorization provider', async () => {
        // Arrange
        const endUserId = 'teacher1'
        const roomId = 'my-room'
        const authenticationToken = 'auth-token'
        const cache = Substitute.for<ICacheProvider>()
        const defaultAutorizationProvider =
          Substitute.for<IAuthorizationProvider>()
        const sut = new CachedAuthorizationProvider(
          defaultAutorizationProvider,
          cache,
        )

        const key = CachedAuthorizationProvider.getCacheKey(endUserId, roomId)
        cache.get(key).resolves('true')

        // Act
        const actual = await sut.isAuthorized(
          endUserId,
          roomId,
          authenticationToken,
        )

        // Assert
        expect(actual).to.equal(true)
        defaultAutorizationProvider.didNotReceive().isAuthorized(Arg.all())
      })
    })

    context('cache returns false', () => {
      it('returns false, and does not call the underlying authorization provider', async () => {
        // Arrange
        const endUserId = 'teacher1'
        const roomId = 'my-room'
        const authenticationToken = 'auth-token'
        const cache = Substitute.for<ICacheProvider>()
        const defaultAutorizationProvider =
          Substitute.for<IAuthorizationProvider>()
        const sut = new CachedAuthorizationProvider(
          defaultAutorizationProvider,
          cache,
        )

        const key = CachedAuthorizationProvider.getCacheKey(endUserId, roomId)
        cache.get(key).resolves('false')

        // Act
        const actual = await sut.isAuthorized(
          endUserId,
          roomId,
          authenticationToken,
        )

        // Assert
        expect(actual).to.equal(false)
        defaultAutorizationProvider.didNotReceive().isAuthorized(Arg.all())
      })
    })

    context(
      'cache returns null; underlying authorization provider returns true',
      () => {
        it('returns true, and calls cache.set', async () => {
          // Arrange
          const endUserId = 'teacher1'
          const roomId = 'my-room'
          const authenticationToken = 'auth-token'
          const cache = Substitute.for<ICacheProvider>()
          const defaultAutorizationProvider =
            Substitute.for<IAuthorizationProvider>()
          const sut = new CachedAuthorizationProvider(
            defaultAutorizationProvider,
            cache,
          )

          const key = CachedAuthorizationProvider.getCacheKey(endUserId, roomId)
          cache.get(key).resolves(null)
          defaultAutorizationProvider.isAuthorized(Arg.all()).resolves(true)

          // Act
          const actual = await sut.isAuthorized(
            endUserId,
            roomId,
            authenticationToken,
          )

          // Assert
          expect(actual).to.equal(true)
          cache.received(1).set(key, 'true', 24 * 60 * 60)
        })
      },
    )

    context(
      'cache returns null; underlying authorization provider returns false',
      () => {
        it('returns false, and calls cache.set', async () => {
          // Arrange
          const endUserId = 'teacher1'
          const roomId = 'my-room'
          const authenticationToken = 'auth-token'
          const cache = Substitute.for<ICacheProvider>()
          const defaultAutorizationProvider =
            Substitute.for<IAuthorizationProvider>()
          const sut = new CachedAuthorizationProvider(
            defaultAutorizationProvider,
            cache,
          )

          const key = CachedAuthorizationProvider.getCacheKey(endUserId, roomId)
          cache.get(key).resolves(null)
          defaultAutorizationProvider.isAuthorized(Arg.all()).resolves(false)

          // Act
          const actual = await sut.isAuthorized(
            endUserId,
            roomId,
            authenticationToken,
          )

          // Assert
          expect(actual).to.equal(false)
          // Consider moving values to config.
          cache.received(1).set(key, 'false', 24 * 60 * 60)
        })
      },
    )

    context('endUserId is falsy', () => {
      it('returns false, and does not call the underlying authorization provider', async () => {
        // Arrange
        const endUserId = undefined
        const roomId = 'my-room'
        const authenticationToken = 'auth-token'
        const cache = Substitute.for<ICacheProvider>()
        const defaultAutorizationProvider =
          Substitute.for<IAuthorizationProvider>()
        const sut = new CachedAuthorizationProvider(
          defaultAutorizationProvider,
          cache,
        )

        // Act
        const actual = await sut.isAuthorized(
          endUserId,
          roomId,
          authenticationToken,
        )

        // Assert
        expect(actual).to.equal(false)
        defaultAutorizationProvider.didNotReceive().isAuthorized(Arg.all())
      })
    })
  })
})

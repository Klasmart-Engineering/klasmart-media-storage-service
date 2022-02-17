import Substitute, { Arg } from '@fluffy-spoon/substitute'
import { expect } from 'chai'
import { Redis } from 'ioredis'
import RedisAuthorizationProvider from '../../src/helpers/redisAuthorizationProvider'
import { IAuthorizationProvider } from '../../src/interfaces/authorizationProvider'

describe('redisAuthorizationProvider', () => {
  describe('isAuthorized', () => {
    context('redis client returns true', () => {
      it('returns true, and does not call the underlying authorization provider', async () => {
        // Arrange
        const endUserId = 'teacher1'
        const roomId = 'my-room'
        const authenticationToken = 'auth-token'
        const redisClient = Substitute.for<Redis>()
        const defaultAutorizationProvider =
          Substitute.for<IAuthorizationProvider>()
        const sut = new RedisAuthorizationProvider(
          defaultAutorizationProvider,
          redisClient,
        )

        const redisKey = `${endUserId}|${roomId}`
        redisClient.get(redisKey).resolves('true')

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

    context('redis client returns false', () => {
      it('returns false, and does not call the underlying authorization provider', async () => {
        // Arrange
        const endUserId = 'teacher1'
        const roomId = 'my-room'
        const authenticationToken = 'auth-token'
        const redisClient = Substitute.for<Redis>()
        const defaultAutorizationProvider =
          Substitute.for<IAuthorizationProvider>()
        const sut = new RedisAuthorizationProvider(
          defaultAutorizationProvider,
          redisClient,
        )

        const redisKey = `${endUserId}|${roomId}`
        redisClient.get(redisKey).resolves('false')

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
      'redis client returns null; underlying authorization provider returns true',
      () => {
        it('returns true, and calls redis.set', async () => {
          // Arrange
          const endUserId = 'teacher1'
          const roomId = 'my-room'
          const authenticationToken = 'auth-token'
          const redisClient = Substitute.for<Redis>()
          const defaultAutorizationProvider =
            Substitute.for<IAuthorizationProvider>()
          const sut = new RedisAuthorizationProvider(
            defaultAutorizationProvider,
            redisClient,
          )

          const redisKey = `${endUserId}|${roomId}`
          redisClient.get(redisKey).resolves(null)
          defaultAutorizationProvider.isAuthorized(Arg.all()).resolves(true)

          // Act
          const actual = await sut.isAuthorized(
            endUserId,
            roomId,
            authenticationToken,
          )

          // Assert
          expect(actual).to.equal(true)
          redisClient.received(1).set(redisKey, 'true', 'ex', 24 * 60 * 60)
        })
      },
    )

    context(
      'redis client returns null; underlying authorization provider returns false',
      () => {
        it('returns false, and calls redis.set', async () => {
          // Arrange
          const endUserId = 'teacher1'
          const roomId = 'my-room'
          const authenticationToken = 'auth-token'
          const redisClient = Substitute.for<Redis>()
          const defaultAutorizationProvider =
            Substitute.for<IAuthorizationProvider>()
          const sut = new RedisAuthorizationProvider(
            defaultAutorizationProvider,
            redisClient,
          )

          const redisKey = `${endUserId}|${roomId}`
          redisClient.get(redisKey).resolves(null)
          defaultAutorizationProvider.isAuthorized(Arg.all()).resolves(false)

          // Act
          const actual = await sut.isAuthorized(
            endUserId,
            roomId,
            authenticationToken,
          )

          // Assert
          expect(actual).to.equal(false)
          redisClient.received(1).set(redisKey, 'false', 'ex', 24 * 60 * 60)
        })
      },
    )
  })
})

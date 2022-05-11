import expect from '../../utils/chaiAsPromisedSetup'
import { Arg, Substitute } from '@fluffy-spoon/substitute'
import { Redis } from 'ioredis'
import RedisCacheProvider from '../../../src/caching/redisCacheProvider'

describe('RedisCacheProvider', () => {
  describe('get', () => {
    context('key exists in redis', () => {
      it('returns corresponding value', async () => {
        // Arrange
        const redisClient = Substitute.for<Redis>()
        const cacheKey = 'key1'
        const cacheValue = 'value1'

        const sut = new RedisCacheProvider(redisClient)

        redisClient.get(cacheKey).resolves(cacheValue)

        // Act
        const expected = cacheValue
        const actual = await sut.get(cacheKey)

        // Assert
        expect(actual).equal(expected)
      })
    })

    context('key does not exist in redis', () => {
      it('returns corresponding value', async () => {
        // Arrange
        const redisClient = Substitute.for<Redis>()
        const cacheKey = 'key1'

        const sut = new RedisCacheProvider(redisClient)

        redisClient.get(cacheKey).resolves(null)

        // Act
        const expected = null
        const actual = await sut.get(cacheKey)

        // Assert
        expect(actual).equal(expected)
      })
    })
  })

  describe('set', () => {
    context('key does not exist in redis', () => {
      it('returns "OK"', async () => {
        // Arrange
        const redisClient = Substitute.for<Redis>()
        const cacheKey = 'key1'
        const cacheValue = 'value1'

        const sut = new RedisCacheProvider(redisClient)

        const ttlSeconds = 10
        redisClient
          .set(cacheKey, cacheValue, 'ex', ttlSeconds, 'nx')
          .resolves('OK')

        // Act
        const expected = 'OK'
        const actual = await sut.set(cacheKey, cacheValue, ttlSeconds)

        // Assert
        expect(actual).equal(expected)
        redisClient.received(1).set(Arg.all())
      })
    })
  })

  describe('delete', () => {
    context('key does not exist in redis', () => {
      it('redisClient.del is called once', async () => {
        // Arrange
        const redisClient = Substitute.for<Redis>()
        const cacheKey = 'key1'

        const sut = new RedisCacheProvider(redisClient)

        // Act
        await sut.delete(cacheKey)

        // Assert
        redisClient.received(1).del(cacheKey)
      })
    })
  })
})

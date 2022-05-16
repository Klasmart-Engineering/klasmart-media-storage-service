import expect from '../../utils/chaiAsPromisedSetup'
import MemoryCacheProvider, {
  MemoryCacheRecord,
} from '../../../src/caching/memoryCacheProvider'
import { TestClock } from './memoryCacheProvider.test'
import { RaceConditionCacheProvider } from '../../../src/caching/RaceConditionCacheProvider'

describe('RaceConditionCacheProvider', () => {
  describe('get', () => {
    context('key exists in cache; not expired', () => {
      it('returns corresponding value', async () => {
        // Arrange
        const cacheKey = 'key1'
        const cacheValue = 'value1'
        const record: MemoryCacheRecord = {
          value: cacheValue,
          expirationMs: 1000,
        }
        const map = new Map([[cacheKey, record]])
        const cache = new MemoryCacheProvider(new TestClock(), map)
        const sut = new RaceConditionCacheProvider(cache)

        // Act
        const expected = cacheValue
        const actual = await sut.get(cacheKey)

        // Assert
        expect(actual).equal(expected)
      })
    })
  })

  describe('set', () => {
    context('key does not exist in cache', () => {
      it('returns "OK"', async () => {
        // Arrange
        const cacheKey = 'key1'
        const cacheValue = 'value1'
        const map = new Map<string, MemoryCacheRecord>()
        const cache = new MemoryCacheProvider(new TestClock(), map)
        const sut = new RaceConditionCacheProvider(cache)

        const ttlSeconds = 1

        // Act
        const expected = 'OK'
        const actual = await sut.set(cacheKey, cacheValue, ttlSeconds)

        // Assert
        expect(actual).equal(expected)

        const record: MemoryCacheRecord = {
          value: cacheValue,
          expirationMs: 1000,
        }
        expect(map).has.lengthOf(1)
        expect(map.get(cacheKey)).deep.equals(record)
      })
    })
  })

  describe('delete', () => {
    context('key exists in cache', () => {
      it('cache is empty', async () => {
        // Arrange
        const cacheKey = 'key1'
        const cacheValue = 'value1'
        const record: MemoryCacheRecord = {
          value: cacheValue,
          expirationMs: 1000,
        }
        const map = new Map([[cacheKey, record]])
        const cache = new MemoryCacheProvider(new TestClock(), map)
        const sut = new RaceConditionCacheProvider(cache)

        // Act
        await sut.delete(cacheKey)

        // Assert
        expect(map).has.lengthOf(0)
      })
    })
  })
})

import expect from '../../utils/chaiAsPromisedSetup'
import { Arg, Substitute } from '@fluffy-spoon/substitute'
import ICacheProvider from '../../../src/interfaces/cacheProvider'
import IKeyPairProvider from '../../../src/interfaces/keyPairProvider'
import CachedKeyPairProvider from '../../../src/providers/cachedKeyPairProvider'
import MemoryCacheProvider from '../../../src/providers/memoryCacheProvider'
import { TestClock } from './memoryCacheProvider.test'

describe('CachedKeyPairProvider', () => {
  describe('getPublicKeyOrCreatePair', () => {
    context('matching public and private keys exist in storage', () => {
      it('returns matching public key', async () => {
        // Arrange
        const keyPairProvider = Substitute.for<IKeyPairProvider>()
        const cache = Substitute.for<ICacheProvider>()
        const ttlSeconds = 1
        const sut = new CachedKeyPairProvider(
          keyPairProvider,
          cache,
          ttlSeconds,
        )

        const objectKey = 'room1'
        const cacheKey = CachedKeyPairProvider.getPublicKeyCacheKey(objectKey)
        const publicKey = Buffer.from([1, 2, 3])
        const base64PublicKey = publicKey.toString('base64')

        cache.get(cacheKey).resolves(base64PublicKey)

        // Act
        const expected = base64PublicKey
        const actual = await sut.getPublicKeyOrCreatePair(objectKey)

        // Assert
        expect(actual).equal(expected)
        keyPairProvider.didNotReceive().getPublicKeyOrCreatePair(Arg.all())
      })
    })

    context('2 requests for the same object key', () => {
      it('both requests return same result', async () => {
        // Arrange
        const keyPairProvider = Substitute.for<IKeyPairProvider>()
        const cache = new MemoryCacheProvider(new TestClock())
        const ttlSeconds = 1
        const sut = new CachedKeyPairProvider(
          keyPairProvider,
          cache,
          ttlSeconds,
        )

        const objectKey = 'room1'
        const publicKey1 = Buffer.from([1, 2, 3])
        const base64PublicKey1 = publicKey1.toString('base64')
        const publicKey2 = Buffer.from([2, 3, 4])
        const base64PublicKey2 = publicKey2.toString('base64')

        // First call returns base64PublicKey1 and second call returns base64PublicKey2.
        keyPairProvider
          .getPublicKeyOrCreatePair(objectKey)
          .resolves(base64PublicKey1, base64PublicKey2)

        // Act
        const task = sut.getPublicKeyOrCreatePair(objectKey)
        const result1 = await sut.getPublicKeyOrCreatePair(objectKey)
        const result2 = await task

        // Assert
        expect(result1).equal(result2)
        keyPairProvider.received(1).getPublicKeyOrCreatePair(Arg.all())
      })
    })
  })

  describe('getPrivateKeyOrThrow', () => {
    context('matching public and private keys exist in storage', () => {
      it('returns matching private key', async () => {
        // Arrange
        const keyPairProvider = Substitute.for<IKeyPairProvider>()
        const cache = Substitute.for<ICacheProvider>()
        const ttlSeconds = 1
        const sut = new CachedKeyPairProvider(
          keyPairProvider,
          cache,
          ttlSeconds,
        )

        const objectKey = 'room1'
        const cacheKey = CachedKeyPairProvider.getPrivateKeyCacheKey(objectKey)
        const privateKey = Buffer.from([4, 5, 6])
        const base64PrivateKey = privateKey.toString('base64')

        cache.get(cacheKey).resolves(base64PrivateKey)

        // Act
        const expected = privateKey
        const actual = await sut.getPrivateKeyOrThrow(objectKey)

        // Assert
        expect(actual).to.deep.equal(expected)
        keyPairProvider.didNotReceive().getPublicKeyOrCreatePair(Arg.all())
      })
    })
  })
})

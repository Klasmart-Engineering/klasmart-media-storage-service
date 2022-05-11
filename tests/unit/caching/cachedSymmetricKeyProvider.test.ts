import expect from '../../utils/chaiAsPromisedSetup'
import { Arg, Substitute } from '@fluffy-spoon/substitute'
import ICacheProvider from '../../../src/interfaces/cacheProvider'
import ISymmetricKeyProvider from '../../../src/interfaces/symmetricKeyProvider'
import CachedSymmetricKeyProvider from '../../../src/caching/cachedSymmetricKeyProvider'

describe('CachedSymmetricKeyProvider', () => {
  describe('getBase64SymmetricKey', () => {
    context('symmetric key not cached', () => {
      it('returns expected symmetric key, and calls cache.set', async () => {
        // Arrange
        const symmetricKeyProvider = Substitute.for<ISymmetricKeyProvider>()
        const cache = Substitute.for<ICacheProvider>()
        const sut = new CachedSymmetricKeyProvider(symmetricKeyProvider, cache)

        const mediaId = 'media1'
        const roomId = 'room1'
        const base64UserPublicKey = 'user1-public-key'
        const base64SymmetricKey = 'abc123'
        const base64EncryptedSymmetricKey = 'encrypted-abc123'
        const cacheKey = CachedSymmetricKeyProvider.getCacheKey(mediaId)
        cache.get(cacheKey).resolves(null)
        symmetricKeyProvider
          .getBase64SymmetricKey(
            mediaId,
            roomId,
            base64UserPublicKey,
            base64EncryptedSymmetricKey,
          )
          .resolves(base64SymmetricKey)

        // Act
        const actual = await sut.getBase64SymmetricKey(
          mediaId,
          roomId,
          base64UserPublicKey,
          base64EncryptedSymmetricKey,
        )

        // Assert
        const expected = base64SymmetricKey
        expect(actual).to.equal(expected)
        cache.received(1).set(cacheKey, expected, Arg.any())
      })
    })

    context('symmetric key is cached', () => {
      it('returns expected symmetric key, and does not call source', async () => {
        // Arrange
        const symmetricKeyProvider = Substitute.for<ISymmetricKeyProvider>()
        const cache = Substitute.for<ICacheProvider>()
        const sut = new CachedSymmetricKeyProvider(symmetricKeyProvider, cache)

        const mediaId = 'media1'
        const roomId = 'room1'
        const base64UserPublicKey = 'user1-public-key'
        const base64SymmetricKey = 'abc123'
        const base64EncryptedSymmetricKey = 'encrypted-abc123'
        const cacheKey = CachedSymmetricKeyProvider.getCacheKey(mediaId)
        cache.get(cacheKey).resolves(base64SymmetricKey)

        // Act
        const actual = await sut.getBase64SymmetricKey(
          mediaId,
          roomId,
          base64UserPublicKey,
          base64EncryptedSymmetricKey,
        )

        // Assert
        const expected = base64SymmetricKey
        expect(actual).to.equal(expected)
        symmetricKeyProvider.received(0).getBase64SymmetricKey(Arg.all())
        cache.received(0).set(Arg.all())
      })
    })
  })
})

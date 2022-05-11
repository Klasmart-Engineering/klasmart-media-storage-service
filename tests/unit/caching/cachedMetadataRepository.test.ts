import expect from '../../utils/chaiAsPromisedSetup'
import { Arg, Substitute } from '@fluffy-spoon/substitute'
import ICacheProvider from '../../../src/interfaces/cacheProvider'
import IMetadataRepository, {
  FindInput,
} from '../../../src/interfaces/metadataRepository'
import CachedMetadataRepository from '../../../src/caching/cachedMetadataRepository'
import { MediaMetadata } from '../../../src/entities/mediaMetadata'

describe('CachedMetadataRepository', () => {
  const metadata: MediaMetadata = {
    base64EncryptedSymmetricKey: 'encrypted-symmetric-key',
    base64UserPublicKey: 'user-public-key',
    createdAt: new Date(),
    description: 'description',
    h5pId: 'h5p1',
    h5pSubId: 'h5pSub1',
    id: 'media1',
    mimeType: 'audio/mp4',
    roomId: 'room1',
    updatedAt: new Date(),
    userId: 'user1',
  }

  describe('findById', () => {
    context('metadata not cached', () => {
      it('returns expected metadata, and calls cache.set', async () => {
        // Arrange
        const metadataRepository = Substitute.for<IMetadataRepository>()
        const cache = Substitute.for<ICacheProvider>()
        const sut = new CachedMetadataRepository(metadataRepository, cache)

        const mediaId = 'media1'
        const cacheKey = CachedMetadataRepository.getFindByIdCacheKey(mediaId)
        cache.get(cacheKey).resolves(null)
        metadataRepository.findById(mediaId).resolves(metadata)

        // Act
        const actual = await sut.findById(mediaId)

        // Assert
        const expected = metadata
        expect(actual).to.deep.equal(expected)

        cache.received(1).set(cacheKey, JSON.stringify(expected), Arg.any())
      })
    })

    context('metadata is cached', () => {
      it('returns expected metadata, and does not call source', async () => {
        // Arrange
        const metadataRepository = Substitute.for<IMetadataRepository>()
        const cache = Substitute.for<ICacheProvider>()
        const sut = new CachedMetadataRepository(metadataRepository, cache)

        const mediaId = 'media1'
        const cacheKey = CachedMetadataRepository.getFindByIdCacheKey(mediaId)
        const json = JSON.stringify(metadata)
        cache.get(cacheKey).resolves(json)
        metadataRepository.findById(mediaId).resolves(metadata)

        // Act
        const actual = await sut.findById(mediaId)

        // Assert
        const expected = metadata
        expect(actual).to.deep.equal(expected)
        metadataRepository.received(0).findById(Arg.all())
        cache.received(0).set(Arg.all())
      })
    })
  })

  describe('find', () => {
    context('metadata not cached', () => {
      it('returns expected metadata, and calls cache.set', async () => {
        // Arrange
        const metadataRepository = Substitute.for<IMetadataRepository>()
        const cache = Substitute.for<ICacheProvider>()
        const sut = new CachedMetadataRepository(metadataRepository, cache)

        const input: FindInput = {
          h5pId: metadata.h5pId,
          h5pSubId: metadata.h5pSubId,
          mediaType: 'audio',
          roomId: 'room1',
          userId: metadata.userId,
        }
        const cacheKey = CachedMetadataRepository.getFindCacheKey(input)
        cache.get(cacheKey).resolves(null)
        metadataRepository.find(input).resolves([metadata])

        // Act
        const actual = await sut.find(input)

        // Assert
        const expected = [metadata]
        expect(actual).to.deep.equal(expected)

        cache.received(1).set(cacheKey, JSON.stringify(expected), Arg.any())
      })
    })

    context('metadata is cached', () => {
      it('returns expected metadata, and does not call source', async () => {
        // Arrange
        const metadataRepository = Substitute.for<IMetadataRepository>()
        const cache = Substitute.for<ICacheProvider>()
        const sut = new CachedMetadataRepository(metadataRepository, cache)

        const input: FindInput = {
          h5pId: metadata.h5pId,
          h5pSubId: metadata.h5pSubId,
          mediaType: 'audio',
          roomId: 'room1',
          userId: metadata.userId,
        }
        const cacheKey = CachedMetadataRepository.getFindCacheKey(input)
        const json = JSON.stringify([metadata])
        cache.get(cacheKey).resolves(json)

        // Act
        const actual = await sut.find(input)

        // Assert
        expect(actual).to.have.lengthOf(1)
        expect(actual[0]).to.deep.equal(metadata)
        metadataRepository.received(0).findById(Arg.all())
        cache.received(0).set(Arg.all())
      })
    })
  })
})

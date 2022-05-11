import expect from '../../utils/chaiAsPromisedSetup'
import { Arg, Substitute } from '@fluffy-spoon/substitute'
import ICacheProvider from '../../../src/interfaces/cacheProvider'
import CachedDownloadInfoProvider from '../../../src/caching/cachedDownloadInfoProvider'
import IDownloadInfoProvider from '../../../src/interfaces/downloadInfoProvider'
import { RequiredDownloadInfo } from '../../../src/graphqlResultTypes/requiredDownloadInfo'

describe('CachedDownloadInfoProvider', () => {
  describe('getDownloadInfo', () => {
    context('download info not cached', () => {
      it('returns expected download info, and calls cache.set', async () => {
        // Arrange
        const downloadInfoProvider = Substitute.for<IDownloadInfoProvider>()
        const cache = Substitute.for<ICacheProvider>()
        const sut = new CachedDownloadInfoProvider(downloadInfoProvider, cache)

        const mediaId = 'media1'
        const roomId = 'room1'
        const endUserId = 'endUser1'
        const base64SymmetricKey = 'abc123'
        const presignedUrl = 'https://download-url'
        const cacheKey = CachedDownloadInfoProvider.getCacheKey(mediaId, roomId)
        cache.get(cacheKey).resolves(null)
        downloadInfoProvider
          .getDownloadInfo(mediaId, roomId, endUserId)
          .resolves({
            base64SymmetricKey,
            presignedUrl,
          })

        // Act
        const actual = await sut.getDownloadInfo(mediaId, roomId, endUserId)

        // Assert
        const expected: RequiredDownloadInfo = {
          base64SymmetricKey,
          presignedUrl,
        }
        expect(actual).to.deep.equal(expected)

        cache.received(1).set(cacheKey, JSON.stringify(expected), Arg.any())
      })
    })

    context('download info is cached', () => {
      it('returns expected download info, and does not call source', async () => {
        // Arrange
        const downloadInfoProvider = Substitute.for<IDownloadInfoProvider>()
        const cache = Substitute.for<ICacheProvider>()
        const sut = new CachedDownloadInfoProvider(downloadInfoProvider, cache)

        const mediaId = 'media1'
        const roomId = 'room1'
        const endUserId = 'endUser1'
        const base64SymmetricKey = 'abc123'
        const presignedUrl = 'https://download-url'
        const cacheKey = CachedDownloadInfoProvider.getCacheKey(mediaId, roomId)
        const jsonResult = JSON.stringify({
          base64SymmetricKey,
          presignedUrl,
        })
        cache.get(cacheKey).resolves(jsonResult)

        // Act
        const actual = await sut.getDownloadInfo(mediaId, roomId, endUserId)

        // Assert
        const expected: RequiredDownloadInfo = {
          base64SymmetricKey,
          presignedUrl,
        }
        expect(actual).to.deep.equal(expected)
        downloadInfoProvider.received(0).getDownloadInfo(Arg.all())
        cache.received(0).set(Arg.all())
      })
    })
  })
})

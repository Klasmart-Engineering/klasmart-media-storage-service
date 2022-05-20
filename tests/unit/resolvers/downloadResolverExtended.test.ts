import expect from '../../utils/chaiAsPromisedSetup'
import Substitute, { Arg } from '@fluffy-spoon/substitute'
import MediaMetadataBuilder from '../../builders/mediaMetadataBuilder'
import { v4 } from 'uuid'
import MetadataResolver from '../../../src/resolvers/metadataResolver'
import ErrorMessage from '../../../src/errors/errorMessages'
import DownloadResolver from '../../../src/resolvers/downloadResolver'
import { DownloadResolverExtended } from '../../../src/resolvers/downloadResolverExtended'
import { RequiredDownloadInfo } from '../../../src/graphqlResultTypes/requiredDownloadInfo'

describe('DownloadResolverExtended', () => {
  describe('getRequiredDownloadInfoForMetadata', () => {
    context('1 matching metadata entry exists', () => {
      it('returns an array of 1 item', async () => {
        // Arrange
        const metadataResolver = Substitute.for<MetadataResolver>()
        const downloadResolver = Substitute.for<DownloadResolver>()

        const metadata = new MediaMetadataBuilder()
          .withMimeType('audio/webm')
          .build()
        const { id: mediaId, roomId, userId, h5pId, h5pSubId } = metadata
        const endUserId = userId
        const mediaType = 'audio'
        if (!roomId) throw 'roomId is falsy'

        metadataResolver
          .mediaMetadata(userId, roomId, h5pId, h5pSubId, mediaType, endUserId)
          .resolves([metadata])

        const expected: RequiredDownloadInfo = {
          base64SymmetricKey: 'abc',
          presignedUrl: 'def',
        }
        downloadResolver
          .getRequiredDownloadInfo(mediaId, roomId, endUserId, undefined)
          .resolves(expected)

        const sut = new DownloadResolverExtended(
          metadataResolver,
          downloadResolver,
        )

        // Act
        const actual = await sut.getRequiredDownloadInfoForMetadata(
          userId,
          roomId,
          h5pId,
          h5pSubId,
          mediaType,
          endUserId,
        )

        // Assert
        expect(actual).to.deep.equal(expected)
      })
    })

    context('0 matching metadata entries exist', () => {
      it('returns an array of 1 item', async () => {
        // Arrange
        const metadataResolver = Substitute.for<MetadataResolver>()
        const downloadResolver = Substitute.for<DownloadResolver>()

        const metadata = new MediaMetadataBuilder()
          .withMimeType('audio/webm')
          .build()
        const { roomId, userId, h5pId, h5pSubId } = metadata
        const endUserId = userId
        const mediaType = 'audio'
        if (!roomId) throw 'roomId is falsy'

        metadataResolver
          .mediaMetadata(userId, roomId, h5pId, h5pSubId, mediaType, endUserId)
          .resolves([])

        const sut = new DownloadResolverExtended(
          metadataResolver,
          downloadResolver,
        )

        // Act
        const actual = await sut.getRequiredDownloadInfoForMetadata(
          userId,
          roomId,
          h5pId,
          h5pSubId,
          mediaType,
          endUserId,
        )

        // Assert
        const expected: RequiredDownloadInfo | null = null
        expect(actual).to.deep.equal(expected)
        downloadResolver.received(0).getRequiredDownloadInfo(Arg.all())
      })
    })

    context('endUserId is undefined', () => {
      it('throws an authentication error', async () => {
        // Arrange
        const metadataResolver = Substitute.for<MetadataResolver>()
        const downloadResolver = Substitute.for<DownloadResolver>()

        const roomId = 'room1'
        const userId = v4()
        const endUserId = undefined
        const h5pId = 'h5p1'
        const h5pSubId = 'h5pSub1'
        const mediaType = 'image'

        const sut = new DownloadResolverExtended(
          metadataResolver,
          downloadResolver,
        )

        // Act
        const fn = () =>
          sut.getRequiredDownloadInfoForMetadata(
            userId,
            roomId,
            h5pId,
            h5pSubId,
            mediaType,
            endUserId,
          )

        // Assert
        await expect(fn()).to.be.rejectedWith(ErrorMessage.notAuthenticated)
      })
    })

    context('mediaType is "video" (unsupported)', () => {
      it('throws an unsupportedMediaType error', async () => {
        // Arrange
        const metadataResolver = Substitute.for<MetadataResolver>()
        const downloadResolver = Substitute.for<DownloadResolver>()

        const roomId = 'room1'
        const userId = v4()
        const endUserId = userId
        const h5pId = 'h5p1'
        const h5pSubId = 'h5pSub1'
        const mediaType = 'video'

        const sut = new DownloadResolverExtended(
          metadataResolver,
          downloadResolver,
        )

        // Act
        const fn = () =>
          sut.getRequiredDownloadInfoForMetadata(
            userId,
            roomId,
            h5pId,
            h5pSubId,
            mediaType,
            endUserId,
          )

        // Assert
        await expect(fn()).to.be.rejectedWith(ErrorMessage.unsupportedMediaType)
      })
    })
  })
})

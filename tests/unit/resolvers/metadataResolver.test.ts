import expect from '../../utils/chaiAsPromisedSetup'
import Substitute from '@fluffy-spoon/substitute'
import MediaMetadataBuilder from '../../builders/mediaMetadataBuilder'
import { v4 } from 'uuid'
import MetadataResolver from '../../../src/resolvers/metadataResolver'
import IMetadataRepository from '../../../src/interfaces/metadataRepository'
import ErrorMessage from '../../../src/errors/errorMessages'

describe('MetadataResolver', () => {
  describe('audioMetadata', () => {
    context('1 matching metadata entry exists', () => {
      it('returns an array of 1 item', async () => {
        // Arrange
        const metadataRepository = Substitute.for<IMetadataRepository>()

        const roomId = 'room1'
        const userId = v4()
        const endUserId = userId
        const h5pId = 'h5p1'
        const h5pSubId = 'h5pSub1'
        const matchingMetadata = new MediaMetadataBuilder()
          .withRoomId(roomId)
          .withUserId(userId)
          .withMimeType('audio/webm')
          .withH5pId(h5pId)
          .withH5pSubId(h5pSubId)
          .build()

        metadataRepository
          .find({ roomId, userId, h5pId, h5pSubId, mediaType: 'audio' })
          .resolves([matchingMetadata])

        const sut = new MetadataResolver(metadataRepository)

        // Act
        const expected = [matchingMetadata]
        const actual = await sut.audioMetadata(
          userId,
          roomId,
          h5pId,
          h5pSubId,
          endUserId,
        )

        // Assert
        expect(actual).to.deep.equal(expected)
      })
    })

    context('endUserId is undefined', () => {
      it('throws an authentication error', async () => {
        // Arrange
        const metadataRepository = Substitute.for<IMetadataRepository>()

        const roomId = 'room1'
        const userId = v4()
        const endUserId = undefined
        const h5pId = 'h5p1'
        const h5pSubId = 'h5pSub1'

        const sut = new MetadataResolver(metadataRepository)

        // Act
        const fn = () =>
          sut.audioMetadata(userId, roomId, h5pId, h5pSubId, endUserId)

        // Assert
        await expect(fn()).to.be.rejectedWith(ErrorMessage.notAuthenticated)
      })
    })
  })

  describe('imageMetadata', () => {
    context('1 matching metadata entry exists', () => {
      it('returns an array of 1 item', async () => {
        // Arrange
        const metadataRepository = Substitute.for<IMetadataRepository>()

        const roomId = 'room1'
        const userId = v4()
        const endUserId = userId
        const h5pId = 'h5p1'
        const h5pSubId = 'h5pSub1'
        const matchingMetadata = new MediaMetadataBuilder()
          .withRoomId(roomId)
          .withUserId(userId)
          .withMimeType('image/jpeg')
          .withH5pId(h5pId)
          .withH5pSubId(h5pSubId)
          .build()

        metadataRepository
          .find({ roomId, userId, h5pId, h5pSubId, mediaType: 'image' })
          .resolves([matchingMetadata])

        const sut = new MetadataResolver(metadataRepository)

        // Act
        const expected = [matchingMetadata]
        const actual = await sut.imageMetadata(
          userId,
          roomId,
          h5pId,
          h5pSubId,
          endUserId,
        )

        // Assert
        expect(actual).to.deep.equal(expected)
      })
    })

    context('endUserId is undefined', () => {
      it('throws an authentication error', async () => {
        // Arrange
        const metadataRepository = Substitute.for<IMetadataRepository>()

        const roomId = 'room1'
        const userId = v4()
        const endUserId = undefined
        const h5pId = 'h5p1'
        const h5pSubId = 'h5pSub1'

        const sut = new MetadataResolver(metadataRepository)

        // Act
        const fn = () =>
          sut.imageMetadata(userId, roomId, h5pId, h5pSubId, endUserId)

        // Assert
        await expect(fn()).to.be.rejectedWith(ErrorMessage.notAuthenticated)
      })
    })
  })

  describe('getStatsAndReset', () => {
    context('no operations executed', () => {
      it('has audioMetadata and imageMetadata keys', async () => {
        // Arrange
        const metadataRepository = Substitute.for<IMetadataRepository>()
        const sut = new MetadataResolver(metadataRepository)

        // Act
        const actual = sut.getStatsAndReset()

        // Assert
        expect(actual).to.have.keys('audioMetadata', 'imageMetadata')
      })
    })
  })
})

import expect from '../../utils/chaiAsPromisedSetup'
import Substitute from '@fluffy-spoon/substitute'
import MediaMetadataBuilder from '../../builders/mediaMetadataBuilder'
import { v4 } from 'uuid'
import MetadataResolver from '../../../src/resolvers/metadataResolver'
import IMetadataRepository from '../../../src/interfaces/metadataRepository'

describe('MetadataResolver', () => {
  describe('mediaMetadata', () => {
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
  })
})

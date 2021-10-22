import { expect } from 'chai'
import Substitute from '@fluffy-spoon/substitute'
import { AudioResolver } from '../../src/resolvers/audioResolver'
import { KeyPairProvider } from '../../src/helpers/keyPairProvider'
import { Repository } from 'typeorm'
import { AudioMetadata } from '../../src/entities/audioMetadata'
import IPresignedUrlProvider from '../../src/interfaces/presignedUrlProvider'
import AudioMetadataBuilder from '../builders/audioMetadataBuilder'
import IDecryptionProvider from '../../src/interfaces/decryptionProvider'
import { v4 } from 'uuid'

describe('AudioResolver', () => {
  describe('audioMetadata', () => {
    context('1 matching metadata entry exists', () => {
      it('returns an array of 1 item', async () => {
        // Arrange
        const metadataRepository = Substitute.for<Repository<AudioMetadata>>()
        const keyPairProvider = Substitute.for<KeyPairProvider>()
        const decryptionProvider = Substitute.for<IDecryptionProvider>()
        const presignedUrlProvider = Substitute.for<IPresignedUrlProvider>()

        const roomId = 'room1'
        const userId = v4()
        const endUserId = userId
        const h5pId = 'h5p1'
        const h5pSubId = 'h5pSub1'
        const matchingMetadata = new AudioMetadataBuilder()
          .withRoomId(roomId)
          .withUserId(userId)
          .withH5pId(h5pId)
          .withH5pSubId(h5pSubId)
          .build()

        metadataRepository
          .find({ roomId, userId, h5pId, h5pSubId })
          .resolves([matchingMetadata])

        const sut = new AudioResolver(
          metadataRepository,
          keyPairProvider,
          decryptionProvider,
          presignedUrlProvider,
        )

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

import { expect } from 'chai'
import Substitute from '@fluffy-spoon/substitute'
import { AudioResolver } from '../../src/resolvers/audioResolver'
import { KeyPairProvider } from '../../src/helpers/keyPairProvider'
import { Repository } from 'typeorm'
import { AudioMetadata } from '../../src/entities/audioMetadata'
import IPresignedUrlProvider from '../../src/interfaces/presignedUrlProvider'
import AudioMetadataBuilder from '../builders/audioMetadataBuilder'
import IDecryptionProvider from '../../src/interfaces/decryptionProvider'

describe('AudioResolver', () => {
  describe('audioMetadataForRoom', () => {
    context('1 metadata entry exists matching provided roomId', () => {
      it('returns an array of 1 item', async () => {
        // Arrange
        const metadataRepository = Substitute.for<Repository<AudioMetadata>>()
        const keyPairProvider = Substitute.for<KeyPairProvider>()
        const decryptionProvider = Substitute.for<IDecryptionProvider>()
        const presignedUrlProvider = Substitute.for<IPresignedUrlProvider>()

        const roomId = 'room1'
        const endUserId = 'user123'
        const matchingMetadata = new AudioMetadataBuilder()
          .withRoomId(roomId)
          .withUserId(endUserId)
          .build()

        metadataRepository
          .find({ roomId, userId: endUserId })
          .resolves([matchingMetadata])

        const sut = new AudioResolver(
          metadataRepository,
          keyPairProvider,
          decryptionProvider,
          presignedUrlProvider,
        )

        // Act
        const expected = [matchingMetadata]
        const actual = await sut.audioMetadataForRoom(roomId, endUserId)

        // Assert
        expect(actual).to.deep.equal(expected)
      })
    })
  })
})

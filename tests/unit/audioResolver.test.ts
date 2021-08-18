import { expect } from 'chai'
import Substitute from '@fluffy-spoon/substitute'
import { AudioResolver } from '../../src/resolvers/audioResolver'
import { KeyPairProvider } from '../../src/helpers/keyPairProvider'
import { Repository } from 'typeorm'
import { AudioMetadata } from '../../src/entities/audioMetadata'
import IUploadUrlProvider from '../../src/interfaces/presignedUrlProvider'
import AudioMetadataBuilder from '../builders/audioMetadataBuilder'
import IDecryptionProvider from '../../src/interfaces/decryptionProvider'

describe('AudioResolver', () => {
  context('1 metadata entry exists matching provided roomId', () => {
    it('returns an array of 1 item', async () => {
      // Arrange
      const metadataRepository = Substitute.for<Repository<AudioMetadata>>()
      const keyPairProvider = Substitute.for<KeyPairProvider>()
      const decryptionProvider = Substitute.for<IDecryptionProvider>()
      const uploadUrlProvider = Substitute.for<IUploadUrlProvider>()

      const roomId = 'room1'
      const matchingMetadata = new AudioMetadataBuilder()
        .withRoomId(roomId)
        .build()

      metadataRepository
        .find({ where: { roomId } })
        .resolves([matchingMetadata])
      metadataRepository.find({ roomId }).resolves([matchingMetadata])

      const sut = new AudioResolver(
        metadataRepository,
        keyPairProvider,
        decryptionProvider,
        uploadUrlProvider,
      )

      // Act
      const expected = [matchingMetadata]
      const actual = await sut.audioMetadataForRoom(roomId)

      // Assert
      expect(actual).to.deep.equal(expected)
    })
  })
})

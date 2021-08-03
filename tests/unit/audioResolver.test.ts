import { expect } from 'chai'
import Substitute from '@fluffy-spoon/substitute'
import { AudioResolver } from '../../src/resolvers/audioResolver'
import { KeyPairProvider } from '../../src/helpers/keyPairProvider'
import { Repository } from 'typeorm'
import { AudioMetadata } from '../../src/entities/audioMetadata'
import { AudioFileRetriever } from '../../src/helpers/audioFileRetriever'
import IUploadUrlProvider from '../../src/interfaces/uploadUrlProvider'
import AudioMetadataBuilder from '../builders/audioMetadataBuilder'

describe('AudioResolver', () => {
  context('1 metadata entry exists matching provided roomId', () => {
    it('returns an array of 1 item', async () => {
      // Arrange
      const metadataRepository = Substitute.for<Repository<AudioMetadata>>()
      const keyPairProvider = Substitute.for<KeyPairProvider>()
      const fileRetriever = Substitute.for<AudioFileRetriever>()
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
        fileRetriever,
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

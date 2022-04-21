import { Substitute } from '@fluffy-spoon/substitute'
import { Repository } from 'typeorm'
import TypeormMetadataRepository from '../../../src/providers/typeormMetadataRepository'
import { MediaMetadata } from '../../../src/entities/mediaMetadata'

// TODO: Replace these tests with integration tests.
describe('typeormMetadataRepository', () => {
  describe('findById', () => {
    context('row exists with mediaId', () => {
      it('calls typeorm.findOne', async () => {
        // Arrange
        const mediaId = 'media1'
        const typeormRepo = Substitute.for<Repository<MediaMetadata>>()
        const sut = new TypeormMetadataRepository(typeormRepo)

        // Act
        await sut.findById(mediaId)

        // Assert
        typeormRepo.received(1).findOne({ id: mediaId })
      })
    })
  })

  describe('delete', () => {
    context('row exists with mediaId', () => {
      it('calls typeorm.delete', async () => {
        // Arrange
        const mediaId = 'media1'
        const typeormRepo = Substitute.for<Repository<MediaMetadata>>()
        const sut = new TypeormMetadataRepository(typeormRepo)

        // Act
        await sut.delete(mediaId, {
          h5pId: 'h5p1',
          h5pSubId: null,
          mediaType: 'audio',
          roomId: 'room1',
          userId: 'user1',
        })

        // Assert
        typeormRepo.received(1).delete(mediaId)
      })
    })
  })
})

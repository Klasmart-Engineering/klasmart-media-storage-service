import expect from '../../utils/chaiAsPromisedSetup'
import Substitute, { Arg } from '@fluffy-spoon/substitute'
import { Like, Repository } from 'typeorm'
import { MediaMetadata } from '../../../src/entities/mediaMetadata'
import MediaMetadataBuilder from '../../builders/mediaMetadataBuilder'
import { v4 } from 'uuid'
import { MetadataResolver } from '../../../src/resolvers/metadataResolver'
import { ErrorMessage } from '../../../src/helpers/errorMessages'

const UnauthorizedErrorMessage =
  'Access denied! You need to be authorized to perform this action!'

describe('MetadataResolver', () => {
  describe('mediaMetadata', () => {
    context('1 matching metadata entry exists', () => {
      it('returns an array of 1 item', async () => {
        // Arrange
        const metadataRepository = Substitute.for<Repository<MediaMetadata>>()

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
          .find({ roomId, userId, h5pId, h5pSubId, mimeType: Like('audio/%') })
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

  describe('setMetadata', () => {
    context('valid arguments provided', () => {
      it('calls repository.insert, and returns true', async () => {
        // Arrange
        const metadataRepository = Substitute.for<Repository<MediaMetadata>>()

        const roomId = 'room1'
        const mediaId = v4()
        const endUserId = v4()
        const h5pId = 'h5p1'
        const h5pSubId = 'h5pSub1'
        const mimeType = 'audio/webm'
        const base64UserPublicKey = 'user-public-key'
        const base64EncryptedSymmetricKey = 'symmetric-key'

        const sut = new MetadataResolver(metadataRepository)

        // Act
        const success = await sut.setMetadata(
          mediaId,
          base64UserPublicKey,
          base64EncryptedSymmetricKey,
          mimeType,
          h5pId,
          h5pSubId,
          endUserId,
          roomId,
        )

        // Assert
        expect(success).to.be.true
        metadataRepository.received(1).insert(Arg.any())
      })
    })

    context('mimeType is image/jpeg', () => {
      it('calls repository.insert, and returns true', async () => {
        // Arrange
        const metadataRepository = Substitute.for<Repository<MediaMetadata>>()

        const roomId = 'room1'
        const mediaId = v4()
        const endUserId = v4()
        const h5pId = 'h5p1'
        const h5pSubId = 'h5pSub1'
        // ******* main difference ******* //
        const mimeType = 'image/jpeg'
        // ******* main difference ******* //
        const base64UserPublicKey = 'user-public-key'
        const base64EncryptedSymmetricKey = 'symmetric-key'

        const sut = new MetadataResolver(metadataRepository)

        // Act
        const success = await sut.setMetadata(
          mediaId,
          base64UserPublicKey,
          base64EncryptedSymmetricKey,
          mimeType,
          h5pId,
          h5pSubId,
          endUserId,
          roomId,
        )

        // Assert
        expect(success).to.be.true
        metadataRepository.received(1).insert(Arg.any())
      })
    })

    context('roomId is undefined', () => {
      it('calls repository.insert, and returns true', async () => {
        // Arrange
        const metadataRepository = Substitute.for<Repository<MediaMetadata>>()

        // ******* main difference ******* //
        const roomId: string | undefined = undefined
        // ******* main difference ******* //
        const mediaId = v4()
        const endUserId = v4()
        const h5pId = 'h5p1'
        const h5pSubId = 'h5pSub1'
        const mimeType = 'audio/webm'
        const base64UserPublicKey = 'user-public-key'
        const base64EncryptedSymmetricKey = 'symmetric-key'
        const description = 'some description'

        const sut = new MetadataResolver(metadataRepository)

        // Act
        const success = await sut.setMetadata(
          mediaId,
          base64UserPublicKey,
          base64EncryptedSymmetricKey,
          mimeType,
          h5pId,
          h5pSubId,
          description,
          endUserId,
          roomId,
        )

        // Assert
        expect(success).to.be.true
        metadataRepository.received(1).insert(Arg.any())
      })
    })

    context('endUserId is undefined', () => {
      it('throws UnauthorizedError', async () => {
        // Arrange
        const metadataRepository = Substitute.for<Repository<MediaMetadata>>()

        const roomId = 'roomId'
        const mediaId = v4()
        // ******* main difference ******* //
        const endUserId: string | undefined = undefined
        // ******* main difference ******* //
        const h5pId = 'h5p1'
        const h5pSubId = 'h5pSub1'
        const mimeType = 'audio/webm'
        const base64UserPublicKey = 'user-public-key'
        const base64EncryptedSymmetricKey = 'symmetric-key'
        const description = 'some description'

        const sut = new MetadataResolver(metadataRepository)

        // Act
        const fn = () =>
          sut.setMetadata(
            mediaId,
            base64UserPublicKey,
            base64EncryptedSymmetricKey,
            mimeType,
            h5pId,
            h5pSubId,
            description,
            endUserId,
            roomId,
          )

        // Assert
        await expect(fn()).to.be.rejectedWith(UnauthorizedErrorMessage)
      })
    })

    context(
      'mimeType has a supported prefix, but nothing after the slash',
      () => {
        it('throws user input error', async () => {
          // Arrange
          const metadataRepository = Substitute.for<Repository<MediaMetadata>>()

          const roomId = 'roomId'
          const mediaId = v4()
          const endUserId = v4()
          const h5pId = 'h5p1'
          const h5pSubId = 'h5pSub1'
          // ******* main difference ******* //
          const mimeType = 'image/'
          // ******* main difference ******* //
          const base64UserPublicKey = 'user-public-key'
          const base64EncryptedSymmetricKey = 'symmetric-key'
          const description = 'some description'

          const sut = new MetadataResolver(metadataRepository)

          // Act
          const fn = () =>
            sut.setMetadata(
              mediaId,
              base64UserPublicKey,
              base64EncryptedSymmetricKey,
              mimeType,
              h5pId,
              h5pSubId,
              description,
              endUserId,
              roomId,
            )

          // Assert
          await expect(fn()).to.be.rejectedWith(
            ErrorMessage.unsupportedMimeType(mimeType),
          )
        })
      },
    )

    context('unsupported mimeType (video/mp4)', () => {
      it('throws user input error', async () => {
        // Arrange
        const metadataRepository = Substitute.for<Repository<MediaMetadata>>()

        const roomId = 'roomId'
        const mediaId = v4()
        const endUserId = v4()
        const h5pId = 'h5p1'
        const h5pSubId = 'h5pSub1'
        // ******* main difference ******* //
        const mimeType = 'video/mp4'
        // ******* main difference ******* //
        const base64UserPublicKey = 'user-public-key'
        const base64EncryptedSymmetricKey = 'symmetric-key'
        const description = 'some description'

        const sut = new MetadataResolver(metadataRepository)

        // Act
        const fn = () =>
          sut.setMetadata(
            mediaId,
            base64UserPublicKey,
            base64EncryptedSymmetricKey,
            mimeType,
            h5pId,
            h5pSubId,
            description,
            endUserId,
            roomId,
          )

        // Assert
        await expect(fn()).to.be.rejectedWith(
          ErrorMessage.unsupportedMimeType(mimeType),
        )
      })
    })
  })
})

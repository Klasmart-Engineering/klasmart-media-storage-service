import expect from '../../utils/chaiAsPromisedSetup'
import Substitute, { Arg } from '@fluffy-spoon/substitute'
import { KeyPairProvider } from '../../../src/providers/keyPairProvider'
import IPresignedUrlProvider from '../../../src/interfaces/presignedUrlProvider'
import { UploadResolver } from '../../../src/resolvers/uploadResolver'
import { ErrorMessage } from '../../../src/helpers/errorMessages'
import { Repository } from 'typeorm'
import { MediaMetadata } from '../../../src/entities/mediaMetadata'
import IUploadValidator from '../../../src/interfaces/uploadValidator'

describe('UploadResolver', () => {
  describe('getRequiredUploadInfo', () => {
    context('valid arguments provided', () => {
      it('returns expected upload info', async () => {
        // Arrange
        const keyPairProvider = Substitute.for<KeyPairProvider>()
        const presignedUrlProvider = Substitute.for<IPresignedUrlProvider>()
        const metadataRepository = Substitute.for<Repository<MediaMetadata>>()
        const uploadValidator = Substitute.for<IUploadValidator>()

        // Input
        const endUserId = 'user1'
        const roomId = 'room1'
        const h5pId = 'h5p1'
        const h5pSubId = 'h5pSub1'
        const mimeType = 'audio/webm'
        const description = 'some description'
        const base64UserPublicKey = 'user-public-key'
        const base64EncryptedSymmetricKey = 'symmetric-key'

        // Output
        const presignedUrl = 'my-upload-url'
        const serverPublicKey = Uint8Array.from([1, 2, 3])
        const base64ServerPublicKey =
          Buffer.from(serverPublicKey).toString('base64')

        presignedUrlProvider
          .getUploadUrl(Arg.any(), mimeType)
          .resolves(presignedUrl)
        keyPairProvider.getPublicKey(roomId).resolves(serverPublicKey)

        const sut = new UploadResolver(
          keyPairProvider,
          presignedUrlProvider,
          metadataRepository,
          uploadValidator,
        )

        // Act
        const expected = {
          presignedUrl,
        }
        const actual = await sut.getRequiredUploadInfo(
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
        expect(actual).to.deep.include(expected)
        metadataRepository.received(1).insert(Arg.any())
      })
    })

    context('mimeType is image/jpeg', () => {
      it('returns expected upload info', async () => {
        // Arrange
        const keyPairProvider = Substitute.for<KeyPairProvider>()
        const presignedUrlProvider = Substitute.for<IPresignedUrlProvider>()
        const metadataRepository = Substitute.for<Repository<MediaMetadata>>()
        const uploadValidator = Substitute.for<IUploadValidator>()

        // Input
        const endUserId = 'user1'
        const roomId = 'room1'
        const h5pId = 'h5p1'
        const h5pSubId = 'h5pSub1'
        // ******* main difference ******* //
        const mimeType = 'image/jpeg'
        // ******* main difference ******* //
        const description = 'some description'
        const base64UserPublicKey = 'user-public-key'
        const base64EncryptedSymmetricKey = 'symmetric-key'

        // Output
        const presignedUrl = 'my-upload-url'
        const serverPublicKey = Uint8Array.from([1, 2, 3])
        const base64ServerPublicKey =
          Buffer.from(serverPublicKey).toString('base64')

        presignedUrlProvider
          .getUploadUrl(Arg.any(), mimeType)
          .resolves(presignedUrl)
        keyPairProvider.getPublicKey(roomId).resolves(serverPublicKey)

        const sut = new UploadResolver(
          keyPairProvider,
          presignedUrlProvider,
          metadataRepository,
          uploadValidator,
        )

        // Act
        const expected = {
          presignedUrl,
        }
        const actual = await sut.getRequiredUploadInfo(
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
        expect(actual).to.deep.include(expected)
        metadataRepository.received(1).insert(Arg.any())
      })
    })

    context('roomId is undefined', () => {
      it('returns expected upload info', async () => {
        // Arrange
        const keyPairProvider = Substitute.for<KeyPairProvider>()
        const presignedUrlProvider = Substitute.for<IPresignedUrlProvider>()
        const metadataRepository = Substitute.for<Repository<MediaMetadata>>()
        const uploadValidator = Substitute.for<IUploadValidator>()

        // Input
        const endUserId = 'user1'
        // ******* main difference ******* //
        const roomId: string | undefined = undefined
        // ******* main difference ******* //
        const h5pId = 'h5p1'
        const h5pSubId = 'h5pSub1'
        const mimeType = 'audio/webm'
        const description = 'some description'
        const base64UserPublicKey = 'user-public-key'
        const base64EncryptedSymmetricKey = 'symmetric-key'

        // Output
        const presignedUrl = 'my-upload-url'
        const serverPublicKey = Uint8Array.from([1, 2, 3])
        const base64ServerPublicKey =
          Buffer.from(serverPublicKey).toString('base64')

        presignedUrlProvider
          .getUploadUrl(Arg.any(), mimeType)
          .resolves(presignedUrl)
        keyPairProvider
          .getPublicKey(UploadResolver.NoRoomIdKeyName)
          .resolves(serverPublicKey)

        const sut = new UploadResolver(
          keyPairProvider,
          presignedUrlProvider,
          metadataRepository,
          uploadValidator,
        )

        // Act
        const expected = {
          presignedUrl,
        }
        const actual = await sut.getRequiredUploadInfo(
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
        expect(actual).to.deep.include(expected)
        metadataRepository.received(1).insert(Arg.any())
      })
    })

    context('endUserId is undefined', () => {
      it('throws unauthorized error', async () => {
        // Arrange
        const keyPairProvider = Substitute.for<KeyPairProvider>()
        const presignedUrlProvider = Substitute.for<IPresignedUrlProvider>()
        const metadataRepository = Substitute.for<Repository<MediaMetadata>>()
        const uploadValidator = Substitute.for<IUploadValidator>()

        // Input
        // ******* main difference ******* //
        const endUserId = undefined
        // ******* main difference ******* //
        const roomId = 'room1'
        const h5pId = 'h5p1'
        const h5pSubId = 'h5pSub1'
        const mimeType = 'audio/webm'
        const description = 'some description'
        const base64UserPublicKey = 'user-public-key'
        const base64EncryptedSymmetricKey = 'symmetric-key'

        // Output
        const presignedUrl = 'my-upload-url'
        const serverPublicKey = Uint8Array.from([1, 2, 3])

        presignedUrlProvider
          .getUploadUrl(Arg.any(), mimeType)
          .resolves(presignedUrl)
        keyPairProvider
          .getPublicKey(UploadResolver.NoRoomIdKeyName)
          .resolves(serverPublicKey)

        const sut = new UploadResolver(
          keyPairProvider,
          presignedUrlProvider,
          metadataRepository,
          uploadValidator,
        )

        // Act
        const fn = () =>
          sut.getRequiredUploadInfo(
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
        await expect(fn()).to.be.rejectedWith(ErrorMessage.notAuthenticated)
        metadataRepository.received(0).insert(Arg.any())
      })
    })

    context(
      'mimeType has a supported prefix, but nothing after the slash',
      () => {
        it('throws user input error', async () => {
          // Arrange
          const keyPairProvider = Substitute.for<KeyPairProvider>()
          const presignedUrlProvider = Substitute.for<IPresignedUrlProvider>()
          const metadataRepository = Substitute.for<Repository<MediaMetadata>>()
          const uploadValidator = Substitute.for<IUploadValidator>()

          // Input
          const endUserId = 'user1'
          const roomId = 'room1'
          const h5pId = 'h5p1'
          const h5pSubId = 'h5pSub1'
          // ******* main difference ******* //
          const mimeType = 'audio/'
          // ******* main difference ******* //
          const description = 'some description'
          const base64UserPublicKey = 'user-public-key'
          const base64EncryptedSymmetricKey = 'symmetric-key'

          // Output
          const presignedUrl = 'my-upload-url'
          const serverPublicKey = Uint8Array.from([1, 2, 3])

          presignedUrlProvider
            .getUploadUrl(Arg.any(), mimeType)
            .resolves(presignedUrl)
          keyPairProvider
            .getPublicKey(UploadResolver.NoRoomIdKeyName)
            .resolves(serverPublicKey)

          const sut = new UploadResolver(
            keyPairProvider,
            presignedUrlProvider,
            metadataRepository,
            uploadValidator,
          )

          // Act
          const fn = () =>
            sut.getRequiredUploadInfo(
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
          metadataRepository.received(0).insert(Arg.any())
        })
      },
    )

    context('unsupported mimeType (video/mp4)', () => {
      it('throws user input error', async () => {
        // Arrange
        const keyPairProvider = Substitute.for<KeyPairProvider>()
        const presignedUrlProvider = Substitute.for<IPresignedUrlProvider>()
        const metadataRepository = Substitute.for<Repository<MediaMetadata>>()
        const uploadValidator = Substitute.for<IUploadValidator>()

        // Input
        const endUserId = 'user1'
        const roomId = 'room1'
        const h5pId = 'h5p1'
        const h5pSubId = 'h5pSub1'
        // ******* main difference ******* //
        const mimeType = 'video/mp4'
        // ******* main difference ******* //
        const description = 'some description'
        const base64UserPublicKey = 'user-public-key'
        const base64EncryptedSymmetricKey = 'symmetric-key'

        // Output
        const presignedUrl = 'my-upload-url'
        const serverPublicKey = Uint8Array.from([1, 2, 3])

        presignedUrlProvider
          .getUploadUrl(Arg.any(), mimeType)
          .resolves(presignedUrl)
        keyPairProvider
          .getPublicKey(UploadResolver.NoRoomIdKeyName)
          .resolves(serverPublicKey)

        const sut = new UploadResolver(
          keyPairProvider,
          presignedUrlProvider,
          metadataRepository,
          uploadValidator,
        )

        // Act
        const fn = () =>
          sut.getRequiredUploadInfo(
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
        metadataRepository.received(0).insert(Arg.any())
      })
    })
  })
})
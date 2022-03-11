import expect from '../../utils/chaiAsPromisedSetup'
import Substitute, { Arg } from '@fluffy-spoon/substitute'
import { KeyPairProvider } from '../../../src/providers/keyPairProvider'
import IPresignedUrlProvider from '../../../src/interfaces/presignedUrlProvider'
import { UploadResolver } from '../../../src/resolvers/uploadResolver'
import { ErrorMessage } from '../../../src/helpers/errorMessages'

describe('UploadResolver', () => {
  describe('getRequiredUploadInfo', () => {
    context('valid arguments provided', () => {
      it('returns expected upload info', async () => {
        // Arrange
        const keyPairProvider = Substitute.for<KeyPairProvider>()
        const presignedUrlProvider = Substitute.for<IPresignedUrlProvider>()

        const mimeType = 'audio/webm'
        const endUserId = 'user1'
        const roomId = 'room1'
        const presignedUrl = 'my-upload-url'
        const serverPublicKey = Uint8Array.from([1, 2, 3])
        const base64ServerPublicKey =
          Buffer.from(serverPublicKey).toString('base64')

        presignedUrlProvider
          .getUploadUrl(Arg.any(), mimeType)
          .resolves(presignedUrl)
        keyPairProvider.getPublicKey(roomId).resolves(serverPublicKey)

        const sut = new UploadResolver(keyPairProvider, presignedUrlProvider)

        // Act
        const expected = {
          presignedUrl,
          base64ServerPublicKey,
        }
        const actual = await sut.getRequiredUploadInfo(
          mimeType,
          roomId,
          endUserId,
        )

        // Assert
        expect(actual).to.deep.include(expected)
      })
    })

    context('mimeType is image/jpeg', () => {
      it('returns expected upload info', async () => {
        // Arrange
        const keyPairProvider = Substitute.for<KeyPairProvider>()
        const presignedUrlProvider = Substitute.for<IPresignedUrlProvider>()

        // ******* main difference ******* //
        const mimeType = 'image/jpeg'
        // ******* main difference ******* //
        const endUserId = 'user1'
        const roomId = 'room1'
        const presignedUrl = 'my-upload-url'
        const serverPublicKey = Uint8Array.from([1, 2, 3])
        const base64ServerPublicKey =
          Buffer.from(serverPublicKey).toString('base64')

        presignedUrlProvider
          .getUploadUrl(Arg.any(), mimeType)
          .resolves(presignedUrl)
        keyPairProvider.getPublicKey(roomId).resolves(serverPublicKey)

        const sut = new UploadResolver(keyPairProvider, presignedUrlProvider)

        // Act
        const expected = {
          presignedUrl,
          base64ServerPublicKey,
        }
        const actual = await sut.getRequiredUploadInfo(
          mimeType,
          roomId,
          endUserId,
        )

        // Assert
        expect(actual).to.deep.include(expected)
      })
    })

    context('roomId is undefined', () => {
      it('returns expected upload info', async () => {
        // Arrange
        const keyPairProvider = Substitute.for<KeyPairProvider>()
        const presignedUrlProvider = Substitute.for<IPresignedUrlProvider>()

        const mimeType = 'audio/webm'
        const endUserId = 'user1'
        // ******* main difference ******* //
        const roomId: string | undefined = undefined
        // ******* main difference ******* //
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

        const sut = new UploadResolver(keyPairProvider, presignedUrlProvider)

        // Act
        const expected = {
          presignedUrl,
          base64ServerPublicKey,
        }
        const actual = await sut.getRequiredUploadInfo(
          mimeType,
          roomId,
          endUserId,
        )

        // Assert
        expect(actual).to.deep.include(expected)
      })
    })

    context('endUserId is undefined', () => {
      it('throws unauthorized error', async () => {
        // Arrange
        const keyPairProvider = Substitute.for<KeyPairProvider>()
        const presignedUrlProvider = Substitute.for<IPresignedUrlProvider>()

        const mimeType = 'audio/webm'
        // ******* main difference ******* //
        const endUserId = undefined
        // ******* main difference ******* //
        const roomId = 'room1'
        const presignedUrl = 'my-upload-url'
        const serverPublicKey = Uint8Array.from([1, 2, 3])

        presignedUrlProvider
          .getUploadUrl(Arg.any(), mimeType)
          .resolves(presignedUrl)
        keyPairProvider
          .getPublicKey(UploadResolver.NoRoomIdKeyName)
          .resolves(serverPublicKey)

        const sut = new UploadResolver(keyPairProvider, presignedUrlProvider)

        // Act
        const fn = () => sut.getRequiredUploadInfo(mimeType, roomId, endUserId)

        // Assert
        await expect(fn()).to.be.rejectedWith(ErrorMessage.notAuthenticated)
      })
    })

    context(
      'mimeType has a supported prefix, but nothing after the slash',
      () => {
        it('throws user input error', async () => {
          // Arrange
          const keyPairProvider = Substitute.for<KeyPairProvider>()
          const presignedUrlProvider = Substitute.for<IPresignedUrlProvider>()

          // ******* main difference ******* //
          const mimeType = 'audio/'
          // ******* main difference ******* //
          const endUserId = 'user1'
          const roomId = 'room1'
          const presignedUrl = 'my-upload-url'
          const serverPublicKey = Uint8Array.from([1, 2, 3])

          presignedUrlProvider
            .getUploadUrl(Arg.any(), mimeType)
            .resolves(presignedUrl)
          keyPairProvider
            .getPublicKey(UploadResolver.NoRoomIdKeyName)
            .resolves(serverPublicKey)

          const sut = new UploadResolver(keyPairProvider, presignedUrlProvider)

          // Act
          const fn = () =>
            sut.getRequiredUploadInfo(mimeType, roomId, endUserId)

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
        const keyPairProvider = Substitute.for<KeyPairProvider>()
        const presignedUrlProvider = Substitute.for<IPresignedUrlProvider>()

        // ******* main difference ******* //
        const mimeType = 'video/mp4'
        // ******* main difference ******* //
        const endUserId = 'user1'
        const roomId = 'room1'
        const presignedUrl = 'my-upload-url'
        const serverPublicKey = Uint8Array.from([1, 2, 3])

        presignedUrlProvider
          .getUploadUrl(Arg.any(), mimeType)
          .resolves(presignedUrl)
        keyPairProvider
          .getPublicKey(UploadResolver.NoRoomIdKeyName)
          .resolves(serverPublicKey)

        const sut = new UploadResolver(keyPairProvider, presignedUrlProvider)

        // Act
        const fn = () => sut.getRequiredUploadInfo(mimeType, roomId, endUserId)

        // Assert
        await expect(fn()).to.be.rejectedWith(
          ErrorMessage.unsupportedMimeType(mimeType),
        )
      })
    })
  })
})

import expect from '../utils/chaiAsPromisedSetup'
import Substitute, { Arg } from '@fluffy-spoon/substitute'
import { AudioResolver } from '../../src/resolvers/audioResolver'
import { KeyPairProvider } from '../../src/helpers/keyPairProvider'
import { Repository } from 'typeorm'
import { AudioMetadata } from '../../src/entities/audioMetadata'
import IPresignedUrlProvider from '../../src/interfaces/presignedUrlProvider'
import AudioMetadataBuilder from '../builders/audioMetadataBuilder'
import IDecryptionProvider from '../../src/interfaces/decryptionProvider'
import { v4 } from 'uuid'
import { getSampleEncryptedData } from '../utils/getSampleEncryptionData'

const UnauthorizedErrorMessage =
  'Access denied! You need to be authorized to perform this action!'

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

    context(
      '1 matching metadata entry exists, but endUserId is different than userId',
      () => {
        it('throws UnauthorizedError', async () => {
          // Arrange
          const metadataRepository = Substitute.for<Repository<AudioMetadata>>()
          const keyPairProvider = Substitute.for<KeyPairProvider>()
          const decryptionProvider = Substitute.for<IDecryptionProvider>()
          const presignedUrlProvider = Substitute.for<IPresignedUrlProvider>()

          const roomId = 'room1'
          const userId = v4()
          const endUserId = v4()
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
          const fn = () =>
            sut.audioMetadata(userId, roomId, h5pId, h5pSubId, endUserId)

          // Assert
          await expect(fn()).to.be.rejectedWith(UnauthorizedErrorMessage)
        })
      },
    )
  })

  describe('getRequiredUploadInfo', () => {
    context('valid arguments provided', () => {
      it('returns expected upload info', async () => {
        // Arrange
        const metadataRepository = Substitute.for<Repository<AudioMetadata>>()
        const keyPairProvider = Substitute.for<KeyPairProvider>()
        const decryptionProvider = Substitute.for<IDecryptionProvider>()
        const presignedUrlProvider = Substitute.for<IPresignedUrlProvider>()

        const mimeType = 'audio/webm'
        const roomId = 'room1'
        const audioId = v4()
        const presignedUrl = 'my-upload-url'
        const serverPublicKey = Uint8Array.from([1, 2, 3])
        const base64ServerPublicKey =
          Buffer.from(serverPublicKey).toString('base64')

        presignedUrlProvider
          .getUploadUrl(Arg.any(), mimeType)
          .resolves(presignedUrl)
        keyPairProvider.getPublicKey(roomId).resolves(serverPublicKey)

        const sut = new AudioResolver(
          metadataRepository,
          keyPairProvider,
          decryptionProvider,
          presignedUrlProvider,
        )

        // Act
        const expected = {
          presignedUrl,
          base64ServerPublicKey,
        }
        const actual = await sut.getRequiredUploadInfo(mimeType, roomId)

        // Assert
        expect(actual).to.deep.include(expected)
      })
    })

    context('roomId is undefined', () => {
      it('throws UnauthorizedError', async () => {
        // Arrange
        const metadataRepository = Substitute.for<Repository<AudioMetadata>>()
        const keyPairProvider = Substitute.for<KeyPairProvider>()
        const decryptionProvider = Substitute.for<IDecryptionProvider>()
        const presignedUrlProvider = Substitute.for<IPresignedUrlProvider>()

        const mimeType = 'audio/webm'
        const roomId: string | undefined = undefined

        const sut = new AudioResolver(
          metadataRepository,
          keyPairProvider,
          decryptionProvider,
          presignedUrlProvider,
        )

        // Act
        const fn = () => sut.getRequiredUploadInfo(mimeType, roomId)

        // Assert
        await expect(fn()).to.be.rejectedWith(UnauthorizedErrorMessage)
      })
    })
  })

  describe('getRequiredDownloadInfo', () => {
    context('valid arguments provided', () => {
      it('returns expected download info', async () => {
        // Arrange
        const metadataRepository = Substitute.for<Repository<AudioMetadata>>()
        const keyPairProvider = Substitute.for<KeyPairProvider>()
        const decryptionProvider = Substitute.for<IDecryptionProvider>()
        const presignedUrlProvider = Substitute.for<IPresignedUrlProvider>()

        const roomId = 'room1'
        const endUserId = v4()
        const audioId = v4()
        const presignedUrl = 'my-download-url'
        const {
          base64EncryptedSymmetricKey,
          base64SymmetricKey,
          base64UserPublicKey,
          serverPrivateKey,
          symmetricKey,
          userPublicKey,
        } = getSampleEncryptedData()
        const metadata = new AudioMetadataBuilder()
          .withId(audioId)
          .withUserId(endUserId)
          .withRoomId(roomId)
          .withBase64UserPublicKey(base64UserPublicKey)
          .withBase64EncryptedSymmetricKey(base64EncryptedSymmetricKey)
          .build()

        presignedUrlProvider.getDownloadUrl(audioId).resolves(presignedUrl)
        keyPairProvider.getPrivateKey(roomId).resolves(serverPrivateKey)
        decryptionProvider
          .decrypt(
            // This special comparison is necessary. Without it, Buffer != Uint8Array.
            Arg.is((x) => Buffer.compare(x, userPublicKey) === 0),
            serverPrivateKey,
            base64EncryptedSymmetricKey,
          )
          .returns(symmetricKey)
        metadataRepository
          .findOne({ id: audioId, userId: endUserId })
          .resolves(metadata)

        const sut = new AudioResolver(
          metadataRepository,
          keyPairProvider,
          decryptionProvider,
          presignedUrlProvider,
        )

        // Act
        const expected = {
          presignedUrl,
          base64SymmetricKey,
        }
        const actual = await sut.getRequiredDownloadInfo(audioId, endUserId)

        // Assert
        expect(actual).to.deep.equal(expected)
      })
    })

    context('endUserId is undefined', () => {
      it('throws UnauthorizedError', async () => {
        // Arrange
        const metadataRepository = Substitute.for<Repository<AudioMetadata>>()
        const keyPairProvider = Substitute.for<KeyPairProvider>()
        const decryptionProvider = Substitute.for<IDecryptionProvider>()
        const presignedUrlProvider = Substitute.for<IPresignedUrlProvider>()

        const audioId = v4()
        const endUserId: string | undefined = undefined

        const sut = new AudioResolver(
          metadataRepository,
          keyPairProvider,
          decryptionProvider,
          presignedUrlProvider,
        )

        // Act
        const fn = () => sut.getRequiredDownloadInfo(audioId, endUserId)

        // Assert
        await expect(fn()).to.be.rejectedWith(UnauthorizedErrorMessage)
      })
    })
  })

  describe('setMetadata', () => {
    context('valid arguments provided', () => {
      it('calls repository.save, and returns true', async () => {
        // Arrange
        const metadataRepository = Substitute.for<Repository<AudioMetadata>>()
        const keyPairProvider = Substitute.for<KeyPairProvider>()
        const decryptionProvider = Substitute.for<IDecryptionProvider>()
        const presignedUrlProvider = Substitute.for<IPresignedUrlProvider>()

        const roomId = 'room1'
        const audioId = v4()
        const endUserId = v4()
        const h5pId = 'h5p1'
        const h5pSubId = 'h5pSub1'
        const mimeType = 'audio/webm'
        const base64UserPublicKey = 'user-public-key'
        const base64EncryptedSymmetricKey = 'symmetric-key'

        const sut = new AudioResolver(
          metadataRepository,
          keyPairProvider,
          decryptionProvider,
          presignedUrlProvider,
        )

        // Act
        const success = await sut.setMetadata(
          audioId,
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
        metadataRepository.received(1).save(Arg.any())
      })
    })

    context('endUserId is undefined', () => {
      it('throws UnauthorizedError', async () => {
        // Arrange
        const metadataRepository = Substitute.for<Repository<AudioMetadata>>()
        const keyPairProvider = Substitute.for<KeyPairProvider>()
        const decryptionProvider = Substitute.for<IDecryptionProvider>()
        const presignedUrlProvider = Substitute.for<IPresignedUrlProvider>()

        const roomId = 'roomId'
        const audioId = v4()
        const endUserId: string | undefined = undefined
        const h5pId = 'h5p1'
        const h5pSubId = 'h5pSub1'
        const mimeType = 'audio/webm'
        const base64UserPublicKey = 'user-public-key'
        const base64EncryptedSymmetricKey = 'symmetric-key'

        const sut = new AudioResolver(
          metadataRepository,
          keyPairProvider,
          decryptionProvider,
          presignedUrlProvider,
        )

        // Act
        const fn = () =>
          sut.setMetadata(
            audioId,
            base64UserPublicKey,
            base64EncryptedSymmetricKey,
            mimeType,
            h5pId,
            h5pSubId,
            endUserId,
            roomId,
          )

        // Assert
        await expect(fn()).to.be.rejectedWith(UnauthorizedErrorMessage)
      })
    })

    context('roomId is undefined', () => {
      it('throws UnauthorizedError', async () => {
        // Arrange
        const metadataRepository = Substitute.for<Repository<AudioMetadata>>()
        const keyPairProvider = Substitute.for<KeyPairProvider>()
        const decryptionProvider = Substitute.for<IDecryptionProvider>()
        const presignedUrlProvider = Substitute.for<IPresignedUrlProvider>()

        const roomId: string | undefined = undefined
        const audioId = v4()
        const endUserId = v4()
        const h5pId = 'h5p1'
        const h5pSubId = 'h5pSub1'
        const mimeType = 'audio/webm'
        const base64UserPublicKey = 'user-public-key'
        const base64EncryptedSymmetricKey = 'symmetric-key'

        const sut = new AudioResolver(
          metadataRepository,
          keyPairProvider,
          decryptionProvider,
          presignedUrlProvider,
        )

        // Act
        const fn = () =>
          sut.setMetadata(
            audioId,
            base64UserPublicKey,
            base64EncryptedSymmetricKey,
            mimeType,
            h5pId,
            h5pSubId,
            endUserId,
            roomId,
          )

        // Assert
        await expect(fn()).to.be.rejectedWith(UnauthorizedErrorMessage)
      })
    })
  })
})

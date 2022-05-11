import 'reflect-metadata'
import expect from '../../utils/chaiAsPromisedSetup'
import Substitute, { Arg } from '@fluffy-spoon/substitute'
import KeyPairProvider from '../../../src/providers/keyPairProvider'
import IPresignedUrlProvider from '../../../src/interfaces/presignedUrlProvider'
import UploadResolver from '../../../src/resolvers/uploadResolver'
import ErrorMessage from '../../../src/errors/errorMessages'
import IUploadValidator from '../../../src/interfaces/uploadValidator'
import IMetadataRepository from '../../../src/interfaces/metadataRepository'
import IKeyPairProvider from '../../../src/interfaces/keyPairProvider'

describe('UploadResolver', () => {
  describe('getRequiredUploadInfo', () => {
    context('userId is not defined', () => {
      it('returns expected upload info', async () => {
        // Arrange
        const keyPairProvider = Substitute.for<KeyPairProvider>()
        const presignedUrlProvider = Substitute.for<IPresignedUrlProvider>()
        const metadataRepository = Substitute.for<IMetadataRepository>()
        const uploadValidator = Substitute.for<IUploadValidator>()

        // Input
        const endUserId = 'user1'
        const userId = null
        const roomId = 'room1'
        const h5pId = 'h5p1'
        const h5pSubId = 'h5pSub1'
        const mimeType = 'audio/webm'
        const description = 'some description'
        const base64UserPublicKey = 'user-public-key'
        const base64EncryptedSymmetricKey = 'symmetric-key'

        // Output
        const presignedUrl = 'my-upload-url'
        const base64ServerPublicKey = Buffer.from([1, 2, 3]).toString('base64')

        presignedUrlProvider
          .getUploadUrl(Arg.any(), mimeType)
          .resolves(presignedUrl)
        keyPairProvider
          .getPublicKeyOrCreatePair(roomId)
          .resolves(base64ServerPublicKey)

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
          userId,
          endUserId,
          roomId,
        )

        // Assert
        expect(actual).to.deep.include(expected)
        metadataRepository.received(1).create(Arg.any())
      })
    })

    context('userId is defined', () => {
      it(
        'returns expected upload info;' +
          'metadataRepository.create is called with userId instead of endUserId',
        async () => {
          // Arrange
          const keyPairProvider = Substitute.for<KeyPairProvider>()
          const presignedUrlProvider = Substitute.for<IPresignedUrlProvider>()
          const metadataRepository = Substitute.for<IMetadataRepository>()
          const uploadValidator = Substitute.for<IUploadValidator>()

          // Input
          const endUserId = 'user1'
          // ******* main difference ******* //
          const userId = 'user2'
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
          const base64ServerPublicKey = Buffer.from([1, 2, 3]).toString(
            'base64',
          )

          presignedUrlProvider
            .getUploadUrl(Arg.any(), mimeType)
            .resolves(presignedUrl)
          keyPairProvider
            .getPublicKeyOrCreatePair(roomId)
            .resolves(base64ServerPublicKey)

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
            userId,
            endUserId,
            roomId,
          )

          // Assert
          expect(actual).to.deep.include(expected)
          metadataRepository
            .received(1)
            .create(Arg.is((x) => x.userId === userId))
        },
      )
    })

    context('mimeType is image/jpeg', () => {
      it('returns expected upload info', async () => {
        // Arrange
        const keyPairProvider = Substitute.for<KeyPairProvider>()
        const presignedUrlProvider = Substitute.for<IPresignedUrlProvider>()
        const metadataRepository = Substitute.for<IMetadataRepository>()
        const uploadValidator = Substitute.for<IUploadValidator>()

        // Input
        const endUserId = 'user1'
        const userId = null
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
        const base64ServerPublicKey = Buffer.from([1, 2, 3]).toString('base64')

        presignedUrlProvider
          .getUploadUrl(Arg.any(), mimeType)
          .resolves(presignedUrl)
        keyPairProvider
          .getPublicKeyOrCreatePair(roomId)
          .resolves(base64ServerPublicKey)

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
          userId,
          endUserId,
          roomId,
        )

        // Assert
        expect(actual).to.deep.include(expected)
        metadataRepository.received(1).create(Arg.any())
      })
    })

    context('roomId is undefined', () => {
      it('returns expected upload info', async () => {
        // Arrange
        const keyPairProvider = Substitute.for<KeyPairProvider>()
        const presignedUrlProvider = Substitute.for<IPresignedUrlProvider>()
        const metadataRepository = Substitute.for<IMetadataRepository>()
        const uploadValidator = Substitute.for<IUploadValidator>()

        // Input
        const endUserId = 'user1'
        const userId = null
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
        const base64ServerPublicKey = Buffer.from([1, 2, 3]).toString('base64')

        presignedUrlProvider
          .getUploadUrl(Arg.any(), mimeType)
          .resolves(presignedUrl)
        keyPairProvider
          .getPublicKeyOrCreatePair(UploadResolver.NoRoomIdKeyName)
          .resolves(base64ServerPublicKey)

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
          userId,
          endUserId,
          roomId,
        )

        // Assert
        expect(actual).to.deep.include(expected)
        metadataRepository.received(1).create(Arg.any())
      })
    })

    context('endUserId is undefined', () => {
      it('throws unauthorized error', async () => {
        // Arrange
        const keyPairProvider = Substitute.for<KeyPairProvider>()
        const presignedUrlProvider = Substitute.for<IPresignedUrlProvider>()
        const metadataRepository = Substitute.for<IMetadataRepository>()
        const uploadValidator = Substitute.for<IUploadValidator>()

        // Input
        // ******* main difference ******* //
        const endUserId = undefined
        // ******* main difference ******* //
        const userId = null
        const roomId = 'room1'
        const h5pId = 'h5p1'
        const h5pSubId = 'h5pSub1'
        const mimeType = 'audio/webm'
        const description = 'some description'
        const base64UserPublicKey = 'user-public-key'
        const base64EncryptedSymmetricKey = 'symmetric-key'

        // Output
        const presignedUrl = 'my-upload-url'
        const base64ServerPublicKey = Buffer.from([1, 2, 3]).toString('base64')

        presignedUrlProvider
          .getUploadUrl(Arg.any(), mimeType)
          .resolves(presignedUrl)
        keyPairProvider
          .getPublicKeyOrCreatePair(UploadResolver.NoRoomIdKeyName)
          .resolves(base64ServerPublicKey)

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
            userId,
            endUserId,
            roomId,
          )

        // Assert
        await expect(fn()).to.be.rejectedWith(ErrorMessage.notAuthenticated)
        metadataRepository.received(0).create(Arg.any())
      })
    })

    context(
      'mimeType has a supported prefix, but nothing after the slash',
      () => {
        it('throws user input error', async () => {
          // Arrange
          const keyPairProvider = Substitute.for<KeyPairProvider>()
          const presignedUrlProvider = Substitute.for<IPresignedUrlProvider>()
          const metadataRepository = Substitute.for<IMetadataRepository>()
          const uploadValidator = Substitute.for<IUploadValidator>()

          // Input
          const endUserId = 'user1'
          const userId = null
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
          const base64ServerPublicKey = Buffer.from([1, 2, 3]).toString(
            'base64',
          )

          presignedUrlProvider
            .getUploadUrl(Arg.any(), mimeType)
            .resolves(presignedUrl)
          keyPairProvider
            .getPublicKeyOrCreatePair(UploadResolver.NoRoomIdKeyName)
            .resolves(base64ServerPublicKey)

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
              userId,
              endUserId,
              roomId,
            )

          // Assert
          await expect(fn()).to.be.rejectedWith(
            ErrorMessage.unsupportedMimeType(mimeType),
          )
          metadataRepository.received(0).create(Arg.any())
        })
      },
    )

    context('unsupported mimeType (video/mp4)', () => {
      it('throws user input error', async () => {
        // Arrange
        const keyPairProvider = Substitute.for<KeyPairProvider>()
        const presignedUrlProvider = Substitute.for<IPresignedUrlProvider>()
        const metadataRepository = Substitute.for<IMetadataRepository>()
        const uploadValidator = Substitute.for<IUploadValidator>()

        // Input
        const endUserId = 'user1'
        const userId = null
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
        const base64ServerPublicKey = Buffer.from([1, 2, 3]).toString('base64')

        presignedUrlProvider
          .getUploadUrl(Arg.any(), mimeType)
          .resolves(presignedUrl)
        keyPairProvider
          .getPublicKeyOrCreatePair(UploadResolver.NoRoomIdKeyName)
          .resolves(base64ServerPublicKey)

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
            userId,
            endUserId,
            roomId,
          )

        // Assert
        await expect(fn()).to.be.rejectedWith(
          ErrorMessage.unsupportedMimeType(mimeType),
        )
        metadataRepository.received(0).create(Arg.any())
      })
    })
  })

  describe('getServerPublicKey', () => {
    context('endUserId is falsy', () => {
      it('throws authentication error', async () => {
        // Arrange
        const keyPairProvider = Substitute.for<KeyPairProvider>()
        const presignedUrlProvider = Substitute.for<IPresignedUrlProvider>()
        const metadataRepository = Substitute.for<IMetadataRepository>()
        const uploadValidator = Substitute.for<IUploadValidator>()

        // Input
        const endUserId = undefined
        const roomId = 'room1'

        const sut = new UploadResolver(
          keyPairProvider,
          presignedUrlProvider,
          metadataRepository,
          uploadValidator,
        )

        // Act
        const fn = () => sut.getServerPublicKey(endUserId, roomId)

        // Assert
        await expect(fn()).to.be.rejectedWith(ErrorMessage.notAuthenticated)
      })
    })

    context('roomId is nullish', () => {
      it('returns expected server public key', async () => {
        // Arrange
        const keyPairProvider = Substitute.for<KeyPairProvider>()
        const presignedUrlProvider = Substitute.for<IPresignedUrlProvider>()
        const metadataRepository = Substitute.for<IMetadataRepository>()
        const uploadValidator = Substitute.for<IUploadValidator>()

        // Input
        const endUserId = 'user1'
        const roomId = undefined
        const base64ServerPublicKey = 'key1'

        const sut = new UploadResolver(
          keyPairProvider,
          presignedUrlProvider,
          metadataRepository,
          uploadValidator,
        )

        keyPairProvider
          .getPublicKeyOrCreatePair(UploadResolver.NoRoomIdKeyName)
          .resolves(base64ServerPublicKey)

        // Act
        const actual = await sut.getServerPublicKey(endUserId, roomId)

        // Assert
        expect(actual).to.equal(base64ServerPublicKey)
      })
    })
  })

  describe('getStatsAndReset', () => {
    context('no operations executed', () => {
      it('has getServerPublicKey and getRequiredUploadInfo keys', async () => {
        // Arrange
        const keyPairProvider = Substitute.for<IKeyPairProvider>()
        const presignedUrlProvider = Substitute.for<IPresignedUrlProvider>()
        const metadataRepository = Substitute.for<IMetadataRepository>()
        const uploadValidator = Substitute.for<IUploadValidator>()
        const sut = new UploadResolver(
          keyPairProvider,
          presignedUrlProvider,
          metadataRepository,
          uploadValidator,
        )

        // Act
        const actual = sut.getStatsAndReset()

        // Assert
        expect(actual).to.have.keys(
          'getServerPublicKey',
          'getRequiredUploadInfo',
        )
      })
    })
  })
})

import expect from '../../utils/chaiAsPromisedSetup'
import Substitute from '@fluffy-spoon/substitute'
import IPresignedUrlProvider from '../../../src/interfaces/presignedUrlProvider'
import MediaMetadataBuilder from '../../builders/mediaMetadataBuilder'
import { v4 } from 'uuid'
import { getSampleEncryptedData } from '../../../helpers/getSampleEncryptionData'
import ErrorMessage from '../../../src/errors/errorMessages'
import SymmetricKeyProvider from '../../../src/providers/symmetricKeyProvider'
import UploadResolver from '../../../src/resolvers/uploadResolver'
import createMediaFileKey from '../../../src/helpers/createMediaFileKey'
import IMetadataRepository from '../../../src/interfaces/metadataRepository'
import DownloadInfoProvider from '../../../src/providers/downloadInfoProvider'

describe('DownloadInfoProvider', () => {
  describe('getDownloadInfo', () => {
    context('valid arguments provided', () => {
      it('returns expected download info', async () => {
        // Arrange
        const metadataRepository = Substitute.for<IMetadataRepository>()
        const symmetricKeyProvider = Substitute.for<SymmetricKeyProvider>()
        const presignedUrlProvider = Substitute.for<IPresignedUrlProvider>()

        const roomId = 'room1'
        const endUserId = v4()
        const mediaId = v4()
        const presignedUrl = 'my-download-url'
        const {
          base64EncryptedSymmetricKey,
          base64SymmetricKey,
          base64UserPublicKey,
        } = getSampleEncryptedData()
        const metadata = new MediaMetadataBuilder()
          .withId(mediaId)
          .withUserId(endUserId)
          .withRoomId(roomId)
          .withBase64UserPublicKey(base64UserPublicKey)
          .withBase64EncryptedSymmetricKey(base64EncryptedSymmetricKey)
          .build()

        const mediaFileKey = createMediaFileKey(mediaId, metadata.mimeType)
        presignedUrlProvider.getDownloadUrl(mediaFileKey).resolves(presignedUrl)
        symmetricKeyProvider
          .getBase64SymmetricKey(
            mediaId,
            roomId,
            base64UserPublicKey,
            base64EncryptedSymmetricKey,
          )
          .resolves(base64SymmetricKey)
        metadataRepository.findById(mediaId).resolves(metadata)

        const sut = new DownloadInfoProvider(
          metadataRepository,
          symmetricKeyProvider,
          presignedUrlProvider,
        )

        // Act
        const expected = {
          presignedUrl,
          base64SymmetricKey,
        }
        const actual = await sut.getDownloadInfo(mediaId, roomId, endUserId)

        // Assert
        expect(actual).to.deep.equal(expected)
      })
    })

    context('metadata roomId is null', () => {
      it('throws "no associated room id" error', async () => {
        // Arrange
        const metadataRepository = Substitute.for<IMetadataRepository>()
        const symmetricKeyProvider = Substitute.for<SymmetricKeyProvider>()
        const presignedUrlProvider = Substitute.for<IPresignedUrlProvider>()

        const keyPairObjectKey = UploadResolver.NoRoomIdKeyName
        const roomIdBeingQueried = 'my-room'
        // ******* main difference ******* //
        const dbRoomId = null
        // ******* main difference ******* //
        const endUserId = v4()
        const mediaId = v4()
        const presignedUrl = 'my-download-url'
        const {
          base64EncryptedSymmetricKey,
          base64SymmetricKey,
          base64UserPublicKey,
        } = getSampleEncryptedData()
        const metadata = new MediaMetadataBuilder()
          .withId(mediaId)
          .withUserId(endUserId)
          .withRoomId(dbRoomId)
          .withBase64UserPublicKey(base64UserPublicKey)
          .withBase64EncryptedSymmetricKey(base64EncryptedSymmetricKey)
          .build()

        presignedUrlProvider.getDownloadUrl(mediaId).resolves(presignedUrl)
        symmetricKeyProvider
          .getBase64SymmetricKey(
            mediaId,
            keyPairObjectKey,
            base64UserPublicKey,
            base64EncryptedSymmetricKey,
          )
          .resolves(base64SymmetricKey)
        metadataRepository.findById(mediaId).resolves(metadata)

        const sut = new DownloadInfoProvider(
          metadataRepository,
          symmetricKeyProvider,
          presignedUrlProvider,
        )

        // Act
        const fn = () =>
          sut.getDownloadInfo(mediaId, roomIdBeingQueried, endUserId)

        // Assert
        await expect(fn()).to.be.rejectedWith(ErrorMessage.mismatchingRoomIds)
      })
    })

    context('metadata does not exist matching mediaId', () => {
      it('throws "media metadata not found" error', async () => {
        // Arrange
        const metadataRepository = Substitute.for<IMetadataRepository>()
        const symmetricKeyProvider = Substitute.for<SymmetricKeyProvider>()
        const presignedUrlProvider = Substitute.for<IPresignedUrlProvider>()

        const roomId = 'my-room'
        const endUserId = v4()
        const mediaId = v4()

        // ******* main difference ******* //
        metadataRepository.findById(mediaId).resolves(undefined)
        // ******* main difference ******* //

        const sut = new DownloadInfoProvider(
          metadataRepository,
          symmetricKeyProvider,
          presignedUrlProvider,
        )

        // Act
        const fn = () => sut.getDownloadInfo(mediaId, roomId, endUserId)

        // Assert
        await expect(fn()).to.be.rejectedWith(
          ErrorMessage.mediaMetadataNotFound(mediaId, endUserId),
        )
      })
    })
  })
})

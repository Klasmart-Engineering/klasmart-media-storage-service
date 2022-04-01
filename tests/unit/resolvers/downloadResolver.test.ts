import expect from '../../utils/chaiAsPromisedSetup'
import Substitute, { Arg } from '@fluffy-spoon/substitute'
import { DownloadResolver } from '../../../src/resolvers/downloadResolver'
import IPresignedUrlProvider from '../../../src/interfaces/presignedUrlProvider'
import MediaMetadataBuilder from '../../builders/mediaMetadataBuilder'
import { v4 } from 'uuid'
import { getSampleEncryptedData } from '../../../helpers/getSampleEncryptionData'
import { ErrorMessage } from '../../../src/helpers/errorMessages'
import AuthorizationProvider from '../../../src/providers/authorizationProvider'
import SymmetricKeyProvider from '../../../src/providers/symmetricKeyProvider'
import { UploadResolver } from '../../../src/resolvers/uploadResolver'
import createMediaFileKey from '../../../src/helpers/createMediaFileKey'
import IMetadataRepository from '../../../src/interfaces/metadataRepository'

const UnauthorizedErrorMessage =
  'Access denied! You need to be authorized to perform this action!'

describe('DownloadResolver', () => {
  describe('getRequiredDownloadInfo', () => {
    context('valid arguments provided', () => {
      it('returns expected download info', async () => {
        // Arrange
        const metadataRepository = Substitute.for<IMetadataRepository>()
        const symmetricKeyProvider = Substitute.for<SymmetricKeyProvider>()
        const presignedUrlProvider = Substitute.for<IPresignedUrlProvider>()
        const authorizationProvider = Substitute.for<AuthorizationProvider>()

        const roomId = 'room1'
        const authenticationToken = 'auth-token'
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
            roomId,
            base64UserPublicKey,
            base64EncryptedSymmetricKey,
          )
          .resolves(base64SymmetricKey)
        metadataRepository.findById(mediaId).resolves(metadata)
        authorizationProvider.isAuthorized(Arg.all()).resolves(true)

        const sut = new DownloadResolver(
          metadataRepository,
          symmetricKeyProvider,
          presignedUrlProvider,
          authorizationProvider,
        )

        // Act
        const expected = {
          presignedUrl,
          base64SymmetricKey,
        }
        const actual = await sut.getRequiredDownloadInfo(
          mediaId,
          roomId,
          endUserId,
          authenticationToken,
        )

        // Assert
        expect(actual).to.deep.equal(expected)
      })
    })

    context('endUserId is undefined', () => {
      it('throws UnauthorizedError', async () => {
        // Arrange
        const metadataRepository = Substitute.for<IMetadataRepository>()
        const symmetricKeyProvider = Substitute.for<SymmetricKeyProvider>()
        const presignedUrlProvider = Substitute.for<IPresignedUrlProvider>()
        const authorizationProvider = Substitute.for<AuthorizationProvider>()

        const roomId = 'my-room'
        const authenticationToken = 'auth-token'
        const mediaId = v4()
        // ******* main difference ******* //
        const endUserId: string | undefined = undefined
        // ******* main difference ******* //
        authorizationProvider.isAuthorized(Arg.all()).resolves(true)

        const sut = new DownloadResolver(
          metadataRepository,
          symmetricKeyProvider,
          presignedUrlProvider,
          authorizationProvider,
        )

        // Act
        const fn = () =>
          sut.getRequiredDownloadInfo(
            mediaId,
            roomId,
            endUserId,
            authenticationToken,
          )

        // Assert
        await expect(fn()).to.be.rejectedWith(UnauthorizedErrorMessage)
      })
    })

    context('metadata roomId is null', () => {
      it('throws "no associated room id" error', async () => {
        // Arrange
        const metadataRepository = Substitute.for<IMetadataRepository>()
        const symmetricKeyProvider = Substitute.for<SymmetricKeyProvider>()
        const presignedUrlProvider = Substitute.for<IPresignedUrlProvider>()
        const authorizationProvider = Substitute.for<AuthorizationProvider>()

        const authenticationToken = 'auth-token'
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
            keyPairObjectKey,
            base64UserPublicKey,
            base64EncryptedSymmetricKey,
          )
          .resolves(base64SymmetricKey)
        metadataRepository.findById(mediaId).resolves(metadata)
        authorizationProvider.isAuthorized(Arg.all()).resolves(true)

        const sut = new DownloadResolver(
          metadataRepository,
          symmetricKeyProvider,
          presignedUrlProvider,
          authorizationProvider,
        )

        // Act
        const fn = () =>
          sut.getRequiredDownloadInfo(
            mediaId,
            roomIdBeingQueried,
            endUserId,
            authenticationToken,
          )

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
        const authorizationProvider = Substitute.for<AuthorizationProvider>()

        const roomId = 'my-room'
        const authenticationToken = 'auth-token'
        const endUserId = v4()
        const mediaId = v4()

        // ******* main difference ******* //
        metadataRepository.findById(mediaId).resolves(undefined)
        // ******* main difference ******* //
        authorizationProvider.isAuthorized(Arg.all()).resolves(true)

        const sut = new DownloadResolver(
          metadataRepository,
          symmetricKeyProvider,
          presignedUrlProvider,
          authorizationProvider,
        )

        // Act
        const fn = () =>
          sut.getRequiredDownloadInfo(
            mediaId,
            roomId,
            endUserId,
            authenticationToken,
          )

        // Assert
        await expect(fn()).to.be.rejectedWith(
          ErrorMessage.mediaMetadataNotFound(mediaId, endUserId),
        )
      })
    })
  })
})

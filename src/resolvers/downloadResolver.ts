import { Arg, Query, Resolver, UnauthorizedError } from 'type-graphql'
import { AuthenticationToken, UserID } from '../auth/context'
import IPresignedUrlProvider from '../interfaces/presignedUrlProvider'
import { RequiredDownloadInfo } from '../graphqlResultTypes/requiredDownloadInfo'
import ErrorMessage from '../helpers/errorMessages'
import IAuthorizationProvider from '../interfaces/authorizationProvider'
import { withLogger } from '@kl-engineering/kidsloop-nodejs-logger'
import createMediaFileKey from '../helpers/createMediaFileKey'
import IMetadataRepository from '../interfaces/metadataRepository'
import ISymmetricKeyProvider from '../interfaces/symmetricKeyProvider'

const logger = withLogger('DownloadResolver')

@Resolver(RequiredDownloadInfo)
export default class DownloadResolver {
  constructor(
    private readonly metadataRepository: IMetadataRepository,
    private readonly symmetricKeyProvider: ISymmetricKeyProvider,
    private readonly presignedUrlProvider: IPresignedUrlProvider,
    private readonly authorizationProvider: IAuthorizationProvider,
  ) {}

  @Query(() => RequiredDownloadInfo, {
    description:
      'Returns a presigned download URL and the base64 encoded symmetric key\n' +
      'that was used to encrypt the media file when it was uploaded.\n' +
      'The symmetric key can be used to decrypt the media file after downloading.',
  })
  public async getRequiredDownloadInfo(
    @Arg('mediaId') mediaId: string,
    @Arg('roomId') roomId: string,
    @UserID() endUserId?: string,
    @AuthenticationToken() authenticationToken?: string,
  ): Promise<RequiredDownloadInfo> {
    logger.debug(
      `[getRequiredDownloadInfo] endUserId: ${endUserId}; roomId: ${roomId}; mediaId: ${mediaId}`,
    )
    const isAuthorized = await this.authorizationProvider.isAuthorized(
      endUserId,
      roomId,
      authenticationToken,
    )
    if (isAuthorized === false || !endUserId) {
      throw new UnauthorizedError()
    }
    const mediaMetadata = await this.metadataRepository.findById(mediaId)

    if (!mediaMetadata) {
      throw new Error(ErrorMessage.mediaMetadataNotFound(mediaId, endUserId))
    }
    const storedRoomId = mediaMetadata.roomId
    if (roomId !== storedRoomId) {
      logger.error(
        `[getRequiredDownloadInfo] media metadata was found for the provided media ID, ` +
          `but the metadata room ID doesn't match the provided room ID.\n` +
          `endUserId: ${endUserId}, mediaId: ${mediaId}, metadata.roomId: ${storedRoomId}, roomId: ${roomId}`,
      )
      throw new Error(ErrorMessage.mismatchingRoomIds)
    }

    const base64SymmetricKey =
      await this.symmetricKeyProvider.getBase64SymmetricKey(
        mediaId,
        roomId,
        mediaMetadata.base64UserPublicKey,
        mediaMetadata.base64EncryptedSymmetricKey,
      )

    const mediaFileKey = createMediaFileKey(mediaId, mediaMetadata.mimeType)
    const presignedUrl = await this.presignedUrlProvider.getDownloadUrl(
      mediaFileKey,
    )
    return { base64SymmetricKey, presignedUrl }
  }
}

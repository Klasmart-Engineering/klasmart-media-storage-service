import { withLogger } from '@kl-engineering/kidsloop-nodejs-logger'
import { ApplicationError } from '../errors/applicationError'
import ErrorMessage from '../errors/errorMessages'
import { RequiredDownloadInfo } from '../graphqlResultTypes/requiredDownloadInfo'
import createMediaFileKey from '../helpers/createMediaFileKey'
import IDownloadInfoProvider from '../interfaces/downloadInfoProvider'
import IMetadataRepository from '../interfaces/metadataRepository'
import IPresignedUrlProvider from '../interfaces/presignedUrlProvider'
import ISymmetricKeyProvider from '../interfaces/symmetricKeyProvider'

const logger = withLogger('DownloadInfoProvider')

export default class DownloadInfoProvider implements IDownloadInfoProvider {
  constructor(
    private readonly metadataRepository: IMetadataRepository,
    private readonly symmetricKeyProvider: ISymmetricKeyProvider,
    private readonly presignedUrlProvider: IPresignedUrlProvider,
  ) {}

  public async getDownloadInfo(
    mediaId: string,
    roomId: string,
    endUserId: string,
  ): Promise<RequiredDownloadInfo> {
    logger.silly(`[getDownloadInfo] roomId: ${roomId}; mediaId: ${mediaId}`)

    const mediaMetadata = await this.metadataRepository.findById(mediaId)

    if (!mediaMetadata) {
      throw new ApplicationError(
        ErrorMessage.mediaMetadataNotFound(mediaId, endUserId),
      )
    }
    const storedRoomId = mediaMetadata.roomId
    if (roomId !== storedRoomId) {
      throw new ApplicationError(ErrorMessage.mismatchingRoomIds, undefined, {
        endUserId,
        mediaId,
        storedRoomId,
        roomId,
      })
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

import { Arg, Query, Resolver, UnauthorizedError } from 'type-graphql'
import { RoomID, UserID } from '../auth/context'
import IPresignedUrlProvider from '../interfaces/presignedUrlProvider'
import { v4 } from 'uuid'
import { RequiredUploadInfo } from '../graphqlResultTypes/requiredUploadInfo'
import { withLogger } from '@kl-engineering/kidsloop-nodejs-logger'
import { UserInputError } from 'apollo-server-core'
import createMediaFileKey from '../helpers/createMediaFileKey'
import isMimeTypeSupported from '../helpers/isMimeTypeSupported'
import ErrorMessage from '../errors/errorMessages'
import IUploadValidator from '../interfaces/uploadValidator'
import IMetadataRepository from '../interfaces/metadataRepository'
import IKeyPairProvider from '../interfaces/keyPairProvider'

const logger = withLogger('UploadResolver')

@Resolver(RequiredUploadInfo)
export default class UploadResolver {
  public static readonly NoRoomIdKeyName = 'no-room-id'

  constructor(
    private readonly keyPairProvider: IKeyPairProvider,
    private readonly presignedUrlProvider: IPresignedUrlProvider,
    private readonly metadataRepository: IMetadataRepository,
    private readonly uploadValidator: IUploadValidator,
  ) {}

  @Query(() => String, {
    description: 'Returns a base64 encoded server public key.',
  })
  public async getServerPublicKey(
    @UserID() endUserId?: string,
    @RoomID() roomId?: string,
  ): Promise<string> {
    logger.debug(
      `[getServerPublicKey] endUserId: ${endUserId}; roomId: ${roomId}`,
    )
    if (!endUserId) {
      throw new UnauthorizedError()
    }
    const keyPairKey = roomId || UploadResolver.NoRoomIdKeyName
    const base64ServerPublicKey =
      await this.keyPairProvider.getPublicKeyOrCreatePair(keyPairKey)

    return base64ServerPublicKey
  }

  @Query(() => RequiredUploadInfo, {
    description: 'Returns a generated media ID and a presigned upload URL.',
  })
  public async getRequiredUploadInfo(
    @Arg('base64UserPublicKey') base64UserPublicKey: string,
    @Arg('base64EncryptedSymmetricKey') base64EncryptedSymmetricKey: string,
    @Arg('mimeType', { description: 'Supported: image/*, audio/*' })
    mimeType: string,
    @Arg('h5pId') h5pId: string,
    @Arg('h5pSubId', () => String, { nullable: true }) h5pSubId: string | null,
    @Arg('description') description: string,
    @Arg('userId', () => String, { nullable: true }) userId: string | null,
    @UserID() endUserId: string | undefined,
    @RoomID() roomId: string | undefined,
  ): Promise<RequiredUploadInfo> {
    logger.debug(
      `[getRequiredUploadInfo] endUserId: ${endUserId}; roomId: ${roomId}; h5pId: ${h5pId}; h5pSubId: ${h5pSubId}; mimeType: ${mimeType}`,
    )
    if (!endUserId) {
      throw new UnauthorizedError()
    }
    if (!isMimeTypeSupported(mimeType)) {
      throw new UserInputError(ErrorMessage.unsupportedMimeType(mimeType))
    }
    const mediaId = v4()
    // TODO: Consider doing UUID validation.
    userId ??= endUserId
    const mediaFileKey = createMediaFileKey(mediaId, mimeType)
    const presignedUrl = await this.presignedUrlProvider.getUploadUrl(
      mediaFileKey,
      mimeType,
    )

    await this.metadataRepository.create({
      id: mediaId,
      userId,
      base64UserPublicKey,
      base64EncryptedSymmetricKey,
      createdAt: new Date(),
      roomId,
      mimeType,
      h5pId,
      h5pSubId,
      description,
    })

    this.uploadValidator.scheduleValidation(
      mediaFileKey,
      mediaId,
      (mediaId) => {
        logger.debug(
          `[uploadValidator] Expected to find media (${mediaId}) in storage but it's not there. ` +
            `This means the client-side upload, via presigned URL, must have failed. ` +
            `Removing the entry from the database... ` +
            `endUserId: ${endUserId}; roomId: ${roomId}; mediaId: ${mediaId}; h5pId: ${h5pId}; h5pSubId: ${h5pSubId}; mimeType: ${mimeType}`,
        )
        return this.metadataRepository.delete(mediaId)
      },
    )

    return { mediaId, presignedUrl }
  }
}

import { Arg, Query, Resolver, UnauthorizedError } from 'type-graphql'
import { KeyPairProvider } from '../providers/keyPairProvider'
import { RoomID, UserID } from '../auth/context'
import IPresignedUrlProvider from '../interfaces/presignedUrlProvider'
import { v4 } from 'uuid'
import { RequiredUploadInfo } from '../graphqlResultTypes/requiredUploadInfo'
import { withLogger } from 'kidsloop-nodejs-logger'
import { UserInputError } from 'apollo-server-core'
import createMediaFileKey from '../helpers/createMediaFileKey'
import isMimeTypeSupported from '../helpers/isMimeTypeSupported'
import { ErrorMessage } from '../helpers/errorMessages'
import IUploadValidator from '../interfaces/uploadValidator'
import IMetadataRepository from '../interfaces/metadataRepository'

const logger = withLogger('UploadResolver')

@Resolver(RequiredUploadInfo)
export class UploadResolver {
  public static readonly NoRoomIdKeyName = 'no-room-id'

  constructor(
    private readonly keyPairProvider: KeyPairProvider,
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
    const serverPublicKey = await this.keyPairProvider.getPublicKey(keyPairKey)
    const base64ServerPublicKey =
      Buffer.from(serverPublicKey).toString('base64')

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
    @UserID() endUserId?: string,
    @RoomID() roomId?: string,
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
    const mediaFileKey = createMediaFileKey(mediaId, mimeType)
    const presignedUrl = await this.presignedUrlProvider.getUploadUrl(
      mediaFileKey,
      mimeType,
    )

    await this.metadataRepository.create({
      id: mediaId,
      userId: endUserId,
      base64UserPublicKey,
      base64EncryptedSymmetricKey,
      createdAt: new Date(),
      roomId,
      mimeType,
      h5pId,
      h5pSubId,
      description,
    })
    this.uploadValidator.validate(mediaFileKey, mediaId)

    return { mediaId, presignedUrl }
  }
}

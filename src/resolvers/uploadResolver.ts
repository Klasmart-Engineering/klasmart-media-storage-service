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

const logger = withLogger('MediaResolver')

@Resolver(RequiredUploadInfo)
export class UploadResolver {
  public static readonly NoRoomIdKeyName = 'no-room-id'

  constructor(
    private readonly keyPairProvider: KeyPairProvider,
    private readonly presignedUrlProvider: IPresignedUrlProvider,
  ) {}

  @Query(() => RequiredUploadInfo, {
    description:
      'Returns a generated media ID, a base64 encoded server public key\n' +
      'and a presigned upload URL. This should be called *before* setMetadata.',
  })
  public async getRequiredUploadInfo(
    @Arg('mimeType', { description: 'Supported: image/*, audio/*' })
    mimeType: string,
    @RoomID() roomId?: string,
    @UserID() endUserId?: string,
  ): Promise<RequiredUploadInfo> {
    logger.debug(
      `[getRequiredUploadInfo] endUserId: ${endUserId}; roomId: ${roomId}`,
    )
    if (!endUserId) {
      throw new UnauthorizedError()
    }
    if (!isMimeTypeSupported(mimeType)) {
      throw new UserInputError(ErrorMessage.unsupportedMimeType(mimeType))
    }
    const keyPairKey = roomId || UploadResolver.NoRoomIdKeyName
    const serverPublicKey = await this.keyPairProvider.getPublicKey(keyPairKey)
    const base64ServerPublicKey =
      Buffer.from(serverPublicKey).toString('base64')
    const mediaId = v4()
    const mediaFileKey = createMediaFileKey(mediaId, mimeType)
    const presignedUrl = await this.presignedUrlProvider.getUploadUrl(
      mediaFileKey,
      mimeType,
    )

    return { mediaId: mediaId, base64ServerPublicKey, presignedUrl }
  }
}

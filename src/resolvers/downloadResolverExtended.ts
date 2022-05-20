import { Arg, Query, Resolver, UnauthorizedError } from 'type-graphql'
import { AuthenticationToken, UserID } from '../auth/context'
import { RequiredDownloadInfo } from '../graphqlResultTypes/requiredDownloadInfo'
import { withLogger } from '@kl-engineering/kidsloop-nodejs-logger'
import MetadataResolver from './metadataResolver'
import DownloadResolver from './downloadResolver'
import ErrorMessage from '../errors/errorMessages'
import { ApplicationError } from '../errors/applicationError'

const logger = withLogger('DownloadResolverExtended')

@Resolver(RequiredDownloadInfo)
export class DownloadResolverExtended {
  constructor(
    private readonly metadataResolver: MetadataResolver,
    private readonly downloadResolver: DownloadResolver,
  ) {}

  @Query(() => RequiredDownloadInfo, {
    description:
      'Returns a presigned download URL and the base64 encoded symmetric key ' +
      'that was used to encrypt the media file when it was uploaded. ' +
      'The symmetric key can be used to decrypt the media file after downloading. ' +
      'If more than one file matches the provided criteria, the one with the ' +
      'earliest timestamp is selected.',
  })
  public async getRequiredDownloadInfoForMetadata(
    @Arg('userId') userId: string,
    @Arg('roomId') roomId: string,
    @Arg('h5pId') h5pId: string,
    @Arg('h5pSubId', () => String, { nullable: true }) h5pSubId: string | null,
    @Arg('mediaType') mediaType: string,
    @UserID() endUserId?: string,
    @AuthenticationToken() authenticationToken?: string,
  ): Promise<RequiredDownloadInfo | null> {
    if (!endUserId) {
      throw new UnauthorizedError()
    }
    if (mediaType !== 'audio' && mediaType !== 'image') {
      throw new ApplicationError(ErrorMessage.unsupportedMediaType, undefined, {
        mediaType,
      })
    }
    const metadataList = await this.metadataResolver.mediaMetadata(
      userId,
      roomId,
      h5pId,
      h5pSubId,
      mediaType,
      endUserId,
    )
    if (metadataList.length <= 0) {
      logger.debug('No metadata found. Returning null.', {
        roomId,
        userId,
        h5pId,
        h5pSubId,
        mediaType,
        endUserId,
      })
      return null
    }
    const downloadInfo = await this.downloadResolver.getRequiredDownloadInfo(
      metadataList[0].id,
      roomId,
      endUserId,
      authenticationToken,
    )

    return downloadInfo
  }
}

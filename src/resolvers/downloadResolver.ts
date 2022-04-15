import { Arg, Query, Resolver, UnauthorizedError } from 'type-graphql'
import { AuthenticationToken, UserID } from '../auth/context'
import { RequiredDownloadInfo } from '../graphqlResultTypes/requiredDownloadInfo'
import IAuthorizationProvider from '../interfaces/authorizationProvider'
import { withLogger } from '@kl-engineering/kidsloop-nodejs-logger'
import IDownloadInfoProvider from '../interfaces/downloadInfoProvider'

const logger = withLogger('DownloadResolver')

@Resolver(RequiredDownloadInfo)
export default class DownloadResolver {
  constructor(
    private readonly downloadInfoProvider: IDownloadInfoProvider,
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
    const result = await this.downloadInfoProvider.getDownloadInfo(
      mediaId,
      roomId,
      endUserId,
    )
    return result
  }
}

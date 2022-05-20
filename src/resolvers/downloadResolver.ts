import { Arg, Query, Resolver, UnauthorizedError } from 'type-graphql'
import { AuthenticationToken, UserID } from '../auth/context'
import { RequiredDownloadInfo } from '../graphqlResultTypes/requiredDownloadInfo'
import IAuthorizationProvider from '../interfaces/authorizationProvider'
import { withLogger } from '@kl-engineering/kidsloop-nodejs-logger'
import IDownloadInfoProvider from '../interfaces/downloadInfoProvider'
import { ResolverStatsInput, StatsInput } from '../providers/statsProvider'

const logger = withLogger('DownloadResolver')

@Resolver(RequiredDownloadInfo)
export default class DownloadResolver {
  private readonly stats = new StatsCollector()

  constructor(
    private readonly downloadInfoProvider: IDownloadInfoProvider,
    private readonly authorizationProvider: IAuthorizationProvider,
  ) {}

  @Query(() => RequiredDownloadInfo, {
    description:
      'Returns a presigned download URL and the base64 encoded symmetric key ' +
      'that was used to encrypt the media file when it was uploaded. ' +
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
    this.stats.getRequiredDownloadInfo.counts.callCount += 1
    const isAuthorized = await this.authorizationProvider.isAuthorized(
      endUserId,
      roomId,
      authenticationToken,
    )
    if (isAuthorized === false || !endUserId) {
      throw new UnauthorizedError()
    }
    this.stats.getRequiredDownloadInfo.sets.users.add(endUserId)
    this.stats.getRequiredDownloadInfo.sets.rooms.add(roomId)
    const result = await this.downloadInfoProvider.getDownloadInfo(
      mediaId,
      roomId,
      endUserId,
    )
    return result
  }

  public getStatsAndReset(): StatsInput {
    const result = this.stats.toStatsInput()
    this.stats.reset()
    return result
  }
}

class StatsCollector {
  private _getRequiredDownloadInfo = new GetRequiredDownloadInfoStats()

  public get getRequiredDownloadInfo() {
    return this._getRequiredDownloadInfo
  }

  public toStatsInput(): StatsInput {
    return {
      getRequiredDownloadInfo: this.getRequiredDownloadInfo,
    }
  }

  public reset() {
    this._getRequiredDownloadInfo = new GetRequiredDownloadInfoStats()
  }
}

class GetRequiredDownloadInfoStats implements ResolverStatsInput {
  public counts = {
    callCount: 0,
  }
  public sets = {
    users: new Set<string>(),
    rooms: new Set<string>(),
  }
}

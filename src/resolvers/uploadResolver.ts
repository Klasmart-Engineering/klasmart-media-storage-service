import { Arg, Query, Resolver, UnauthorizedError } from 'type-graphql'
import { RoomID, UserID } from '../auth/context'
import IPresignedUrlProvider from '../interfaces/presignedUrlProvider'
import { v4 } from 'uuid'
import { RequiredUploadInfo } from '../graphqlResultTypes/requiredUploadInfo'
import { withLogger } from '@kl-engineering/kidsloop-nodejs-logger'
import createMediaFileKey from '../helpers/createMediaFileKey'
import IUploadValidator from '../interfaces/uploadValidator'
import IMetadataRepository from '../interfaces/metadataRepository'
import IKeyPairProvider from '../interfaces/keyPairProvider'
import { ResolverStatsInput, StatsInput } from '../providers/statsProvider'

const logger = withLogger('UploadResolver')

@Resolver(RequiredUploadInfo)
export default class UploadResolver {
  public static readonly NoRoomIdKeyName = 'no-room-id'
  private readonly stats = new StatsCollector()

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
    this.stats.getServerPublicKey.counts.callCount += 1
    if (!endUserId) {
      throw new UnauthorizedError()
    }
    if (!roomId) {
      this.stats.getServerPublicKey.counts.noRoomCount += 1
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
    this.stats.getRequiredUploadInfo.counts.callCount += 1
    if (!endUserId) {
      throw new UnauthorizedError()
    }
    if (!roomId) {
      this.stats.getRequiredUploadInfo.counts.noRoomCount += 1
    }
    const mediaId = v4()
    const { mediaFileKey, mediaType } = createMediaFileKey(mediaId, mimeType)
    // TODO: Consider doing UUID validation.
    userId ??= endUserId

    this.stats.getRequiredUploadInfo.sets.users.add(userId)
    this.stats.getRequiredUploadInfo.sets.rooms.add(
      roomId || UploadResolver.NoRoomIdKeyName,
    )
    this.stats.getRequiredUploadInfo.counts[mediaType + 'Count'] += 1

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
      {
        h5pId,
        h5pSubId,
        mediaType,
        roomId: roomId || UploadResolver.NoRoomIdKeyName,
        userId,
      },
      (mediaId, findInput) => {
        logger.debug(
          `[uploadValidator] Expected to find media (${mediaId}) in storage but it's not there. ` +
            `This means the client-side upload, via presigned URL, must have failed. ` +
            `Removing the entry from the database... ` +
            `endUserId: ${endUserId}; roomId: ${roomId}; mediaId: ${mediaId}; h5pId: ${h5pId}; h5pSubId: ${h5pSubId}; mimeType: ${mimeType}`,
        )
        this.stats.getRequiredUploadInfo.counts.failedUploadCount += 1
        return this.metadataRepository.delete(mediaId, findInput)
      },
    )

    return { mediaId, presignedUrl }
  }

  public getStats(): StatsInput {
    return this.stats.toStatsInput()
  }
}

class StatsCollector {
  public getServerPublicKey = new GetServerPublicKeyStats()
  public getRequiredUploadInfo = new GetRequiredUploadInfoStats()

  public toStatsInput(): StatsInput {
    return {
      getServerPublicKey: this.getServerPublicKey,
      getRequiredUploadInfo: this.getRequiredUploadInfo,
    }
  }
}

class GetServerPublicKeyStats implements ResolverStatsInput {
  public counts = {
    callCount: 0,
    noRoomCount: 0,
  }
  public sets = {}
}

class GetRequiredUploadInfoStats implements ResolverStatsInput {
  public counts: {
    callCount: number
    noRoomCount: number
    audioCount: number
    imageCount: number
    failedUploadCount: number
    [key: string]: number
  } = {
    callCount: 0,
    noRoomCount: 0,
    audioCount: 0,
    imageCount: 0,
    failedUploadCount: 0,
  }
  public sets = {
    users: new Set<string>(),
    rooms: new Set<string>(),
  }
}

import { Arg, Query, Resolver, UnauthorizedError } from 'type-graphql'
import { MediaMetadata } from '../entities/mediaMetadata'
import { UserID } from '../auth/context'
import { withLogger } from '@kl-engineering/kidsloop-nodejs-logger'
import IMetadataRepository from '../interfaces/metadataRepository'
import { ResolverStatsInput, StatsInput } from '../providers/statsProvider'

const logger = withLogger('MetadataResolver')

@Resolver(MediaMetadata)
export default class MetadataResolver {
  private readonly stats = new StatsCollector()

  constructor(private readonly metadataRepository: IMetadataRepository) {}

  @Query(() => [MediaMetadata], {
    description:
      'Returns a list of audio metadata matching the provided arguments.',
  })
  public async audioMetadata(
    @Arg('userId') userId: string,
    @Arg('roomId') roomId: string,
    @Arg('h5pId') h5pId: string,
    @Arg('h5pSubId', () => String, { nullable: true }) h5pSubId: string | null,
    @UserID() endUserId?: string,
  ): Promise<MediaMetadata[]> {
    logger.debug(
      `[audioMetadata] endUserId: ${endUserId}; userId: ${userId}; roomId: ${roomId}; h5pId: ${h5pId}; h5pSubId: ${h5pSubId}`,
    )
    this.stats.audioMetadata.counts.callCount += 1
    if (!endUserId) {
      throw new UnauthorizedError()
    }
    this.stats.imageMetadata.sets.user.add(endUserId)
    this.stats.imageMetadata.sets.room.add(roomId)

    h5pSubId ??= null
    const results = await this.metadataRepository.find({
      userId,
      roomId,
      h5pId,
      h5pSubId,
      mediaType: 'audio',
    })
    return results
  }

  @Query(() => [MediaMetadata], {
    description:
      'Returns a list of image metadata matching the provided arguments.',
  })
  public async imageMetadata(
    @Arg('userId') userId: string,
    @Arg('roomId') roomId: string,
    @Arg('h5pId') h5pId: string,
    @Arg('h5pSubId', () => String, { nullable: true }) h5pSubId: string | null,
    @UserID() endUserId?: string,
  ): Promise<MediaMetadata[]> {
    logger.debug(
      `[imageMetadata] endUserId: ${endUserId}; userId: ${userId}; roomId: ${roomId}; h5pId: ${h5pId}; h5pSubId: ${h5pSubId}`,
    )
    this.stats.imageMetadata.counts.callCount += 1
    if (!endUserId) {
      throw new UnauthorizedError()
    }
    this.stats.imageMetadata.sets.user.add(endUserId)
    this.stats.imageMetadata.sets.room.add(roomId)

    h5pSubId ??= null
    const results = await this.metadataRepository.find({
      userId,
      roomId,
      h5pId,
      h5pSubId,
      mediaType: 'image',
    })
    return results
  }

  public getStats(): StatsInput {
    return this.stats.toStatsInput()
  }
}

class StatsCollector {
  public audioMetadata = new MetadataStats()
  public imageMetadata = new MetadataStats()

  public toStatsInput(): StatsInput {
    return Object.assign(
      {},
      {
        audioMetadata: this.audioMetadata,
        imageMetadata: this.imageMetadata,
      },
    )
  }
}

class MetadataStats implements ResolverStatsInput {
  public counts = {
    callCount: 0,
  }
  public sets = {
    user: new Set<string>(),
    room: new Set<string>(),
  }
}

import { Arg, Query, Resolver, UnauthorizedError } from 'type-graphql'
import { MediaMetadata } from '../entities/mediaMetadata'
import { UserID } from '../auth/context'
import { withLogger } from '@kl-engineering/kidsloop-nodejs-logger'
import IMetadataRepository from '../interfaces/metadataRepository'
import { ResolverStatsInput, StatsInput } from '../providers/statsProvider'
import { ApplicationError } from '../errors/applicationError'
import ErrorMessage from '../errors/errorMessages'

const logger = withLogger('MetadataResolver')

@Resolver(MediaMetadata)
export default class MetadataResolver {
  private readonly stats = new StatsCollector()

  constructor(private readonly metadataRepository: IMetadataRepository) {}

  @Query(() => [MediaMetadata], {
    description:
      'Returns a list of audio metadata matching the provided arguments.',
    deprecationReason: 'Use the more generic mediaMetadata query.',
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
    this.stats.audioMetadata.sets.users.add(endUserId)
    this.stats.audioMetadata.sets.rooms.add(roomId)

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
    deprecationReason: 'Use the more generic mediaMetadata query.',
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
    this.stats.imageMetadata.sets.users.add(endUserId)
    this.stats.imageMetadata.sets.rooms.add(roomId)

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

  @Query(() => [MediaMetadata], {
    description:
      'Returns a list of image metadata matching the provided arguments.',
  })
  public async mediaMetadata(
    @Arg('userId') userId: string,
    @Arg('roomId') roomId: string,
    @Arg('h5pId') h5pId: string,
    @Arg('h5pSubId', () => String, { nullable: true }) h5pSubId: string | null,
    @Arg('mediaType') mediaType: 'audio' | 'image',
    @UserID() endUserId?: string,
  ): Promise<MediaMetadata[]> {
    logger.debug(
      `[mediaMetadata] endUserId: ${endUserId}; roomId: ${roomId}; userId: ${userId}; h5pId: ${h5pId}; h5pSubId: ${h5pSubId}`,
    )
    if (!endUserId) {
      throw new UnauthorizedError()
    }
    if (mediaType === 'audio') {
      return this.audioMetadata(userId, roomId, h5pId, h5pSubId, endUserId)
    }
    if (mediaType === 'image') {
      return this.imageMetadata(userId, roomId, h5pId, h5pSubId, endUserId)
    }
    throw new ApplicationError(ErrorMessage.unsupportedMediaType, undefined, {
      mediaType,
    })
  }

  public getStatsAndReset(): StatsInput {
    const result = this.stats.toStatsInput()
    this.stats.reset()
    return result
  }
}

class StatsCollector {
  public _audioMetadata = new MetadataStats()
  public _imageMetadata = new MetadataStats()

  public get audioMetadata() {
    return this._audioMetadata
  }

  public get imageMetadata() {
    return this._imageMetadata
  }

  public toStatsInput(): StatsInput {
    return {
      audioMetadata: this.audioMetadata,
      imageMetadata: this.imageMetadata,
    }
  }

  public reset() {
    this._audioMetadata = new MetadataStats()
    this._imageMetadata = new MetadataStats()
  }
}

class MetadataStats implements ResolverStatsInput {
  public counts = {
    callCount: 0,
  }
  public sets = {
    users: new Set<string>(),
    rooms: new Set<string>(),
  }
}

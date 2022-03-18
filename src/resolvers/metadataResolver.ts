import { Arg, Query, Resolver, UnauthorizedError } from 'type-graphql'
import { Repository, Like } from 'typeorm'
import { MediaMetadata } from '../entities/mediaMetadata'
import { UserID } from '../auth/context'
import { withLogger } from 'kidsloop-nodejs-logger'

const logger = withLogger('MetadataResolver')

@Resolver(MediaMetadata)
export class MetadataResolver {
  constructor(private readonly metadataRepository: Repository<MediaMetadata>) {}

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
    if (!endUserId) {
      throw new UnauthorizedError()
    }
    h5pSubId ??= null
    const results = await this.metadataRepository.find({
      userId,
      roomId,
      h5pId,
      h5pSubId,
      mimeType: Like('audio/%'),
    })
    return results
  }
}

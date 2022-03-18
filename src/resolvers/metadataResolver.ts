import { Arg, Mutation, Query, Resolver, UnauthorizedError } from 'type-graphql'
import { Repository, Like } from 'typeorm'
import { MediaMetadata } from '../entities/mediaMetadata'
import { RoomID, UserID } from '../auth/context'
import { withLogger } from 'kidsloop-nodejs-logger'
import isMimeTypeSupported from '../helpers/isMimeTypeSupported'
import { UserInputError } from 'apollo-server-core'
import { ErrorMessage } from '../helpers/errorMessages'

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

  @Mutation(() => Boolean, {
    description:
      'Stores the media metadata in persistent storage.\n' +
      'This should be called *after* getRequiredUploadInfo and *after* successfully\n' +
      'uploading the media file.',
  })
  public async setMetadata(
    @Arg('mediaId') mediaId: string,
    @Arg('base64UserPublicKey') base64UserPublicKey: string,
    @Arg('base64EncryptedSymmetricKey') base64EncryptedSymmetricKey: string,
    @Arg('mimeType', { description: 'Supported: image/*, audio/*' })
    mimeType: string,
    @Arg('h5pId') h5pId: string,
    @Arg('h5pSubId', () => String, { nullable: true }) h5pSubId: string | null,
    @Arg('description') description: string,
    @UserID() endUserId?: string,
    @RoomID() roomId?: string,
  ): Promise<boolean> {
    logger.debug(
      `[setMetadata] mediaId: ${mediaId}; endUserId: ${endUserId}; roomId: ${roomId}; h5pId: ${h5pId}; h5pSubId: ${h5pSubId}`,
    )
    if (!endUserId) {
      throw new UnauthorizedError()
    }
    if (!isMimeTypeSupported(mimeType)) {
      throw new UserInputError(ErrorMessage.unsupportedMimeType(mimeType))
    }
    const entity = this.metadataRepository.create({
      id: mediaId,
      userId: endUserId,
      base64UserPublicKey,
      base64EncryptedSymmetricKey,
      roomId,
      mimeType,
      h5pId,
      h5pSubId,
      description,
    })
    await this.metadataRepository.insert(entity)

    return true
  }
}

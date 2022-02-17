import {
  Arg,
  Authorized,
  Mutation,
  Query,
  Resolver,
  UnauthorizedError,
} from 'type-graphql'
import { Repository } from 'typeorm'
import { AudioMetadata } from '../entities/audioMetadata'
import { KeyPairProvider } from '../helpers/keyPairProvider'
import { AuthenticationToken, RoomID, UserID } from '../auth/context'
import IPresignedUrlProvider from '../interfaces/presignedUrlProvider'
import { v4 } from 'uuid'
import { RequiredDownloadInfo } from '../graphqlResultTypes/requiredDownloadInfo'
import IDecryptionProvider from '../interfaces/decryptionProvider'
import { RequiredUploadInfo } from '../graphqlResultTypes/requiredUploadInfo'
import { ErrorMessage } from '../helpers/errorMessages'
import { IAuthorizationProvider } from '../interfaces/authorizationProvider'
import { withLogger } from 'kidsloop-nodejs-logger'

// TODO: log/logger naming consistency.
const logger = withLogger('AudioResolver')

@Resolver(AudioMetadata)
export class AudioResolver {
  public static readonly NoRoomIdKeyName = 'no-room-id'

  constructor(
    private readonly metadataRepository: Repository<AudioMetadata>,
    private readonly keyPairProvider: KeyPairProvider,
    private readonly decryptionProvider: IDecryptionProvider,
    private readonly presignedUrlProvider: IPresignedUrlProvider,
    private readonly authorizationProvider: IAuthorizationProvider,
  ) {}

  // TODO: Remove Authorized decorators for performance
  @Authorized()
  @Query(() => [AudioMetadata], {
    description:
      'Returns a list of audio metadata matching the provided arguments.',
  })
  public async audioMetadata(
    @Arg('userId') userId: string,
    @Arg('roomId') roomId: string,
    @Arg('h5pId') h5pId: string,
    @Arg('h5pSubId', () => String, { nullable: true }) h5pSubId: string | null,
    @UserID() endUserId?: string,
  ): Promise<AudioMetadata[]> {
    if (!endUserId) {
      throw new UnauthorizedError()
    }
    const results = await this.metadataRepository.find({
      userId,
      roomId,
      h5pId,
      h5pSubId,
    })
    return results
  }

  @Authorized()
  @Query(() => RequiredUploadInfo, {
    description:
      'Returns a generated audio ID, a base64 encoded server public key\n' +
      'and a presigned upload URL. This should be called *before* setMetadata.',
  })
  public async getRequiredUploadInfo(
    @Arg('mimeType') mimeType: string,
    @RoomID() roomId?: string,
  ): Promise<RequiredUploadInfo> {
    if (!roomId) {
      roomId = AudioResolver.NoRoomIdKeyName
    }
    // Key pair file name is roomId.
    const serverPublicKey = await this.keyPairProvider.getPublicKey(roomId)
    const base64ServerPublicKey =
      Buffer.from(serverPublicKey).toString('base64')
    const audioId = v4()
    const presignedUrl = await this.presignedUrlProvider.getUploadUrl(
      audioId,
      mimeType,
    )

    return { audioId, base64ServerPublicKey, presignedUrl }
  }

  @Authorized()
  @Mutation(() => Boolean, {
    description:
      'Stores the audio metadata in persistent storage.\n' +
      'This should be called *after* getRequiredUploadInfo and *after* successfully\n' +
      'uploading the audio file.',
  })
  public async setMetadata(
    @Arg('audioId') audioId: string,
    @Arg('base64UserPublicKey') base64UserPublicKey: string,
    @Arg('base64EncryptedSymmetricKey') base64EncryptedSymmetricKey: string,
    @Arg('mimeType') mimeType: string,
    @Arg('h5pId') h5pId: string,
    @Arg('h5pSubId', () => String, { nullable: true }) h5pSubId: string | null,
    @Arg('description') description: string,
    @UserID() endUserId?: string,
    @RoomID() roomId?: string,
  ): Promise<boolean> {
    if (!endUserId) {
      throw new UnauthorizedError()
    }
    const entity = this.metadataRepository.create({
      id: audioId,
      userId: endUserId,
      base64UserPublicKey,
      base64EncryptedSymmetricKey,
      creationDate: new Date(),
      roomId,
      mimeType,
      h5pId,
      h5pSubId,
      description,
    })
    // TODO: Optimize.
    await this.metadataRepository.save(entity)

    return true
  }

  @Authorized()
  @Query(() => RequiredDownloadInfo, {
    description:
      'Returns a presigned download URL and the base64 encoded symmetric key\n' +
      'that was used to encrypt the audio file when it was uploaded.\n' +
      'The symmetric key can be used to decrypt the audio file after downloading.',
  })
  public async getRequiredDownloadInfo(
    @Arg('audioId') audioId: string,
    @Arg('roomId') roomId: string,
    @UserID() endUserId?: string,
    @AuthenticationToken() authenticationToken?: string,
  ): Promise<RequiredDownloadInfo> {
    const isAuthorized = await this.authorizationProvider.isAuthorized(
      endUserId,
      roomId,
      authenticationToken,
    )
    if (isAuthorized === false || !endUserId) {
      throw new UnauthorizedError()
    }
    const audioMetadata = await this.metadataRepository.findOne({
      id: audioId,
    })

    if (!audioMetadata) {
      throw new Error(ErrorMessage.audioMetadataNotFound(audioId, endUserId))
    }
    const storedRoomId = audioMetadata.roomId
    if (roomId !== storedRoomId) {
      logger.error(
        `[getRequiredDownloadInfo] audio metadata was found for the provided audio ID, ` +
          `but the metadata room ID doesn't match the provided room ID.\n` +
          `endUserId: ${endUserId}, audioId: ${audioId}, metadata.roomId: ${storedRoomId}, roomId: ${roomId}`,
      )
      throw new Error(ErrorMessage.mismatchingRoomIds)
    }

    const userPublicKey = Buffer.from(
      audioMetadata.base64UserPublicKey,
      'base64',
    )

    const serverPrivateKey = await this.keyPairProvider.getPrivateKey(roomId)
    const symmetricKey = this.decryptionProvider.decrypt(
      userPublicKey,
      serverPrivateKey,
      audioMetadata.base64EncryptedSymmetricKey,
    )
    const base64SymmetricKey = Buffer.from(symmetricKey).toString('base64')
    const presignedUrl = await this.presignedUrlProvider.getDownloadUrl(audioId)
    return { base64SymmetricKey, presignedUrl }
  }
}

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
import { RoomID, UserID } from '../auth/context'
import IPresignedUrlProvider from '../interfaces/presignedUrlProvider'
import { v4 } from 'uuid'
import { RequiredDownloadInfo } from '../graphqlResultTypes/requiredDownloadInfo'
import IDecryptionProvider from '../interfaces/decryptionProvider'
import { RequiredUploadInfo } from '../graphqlResultTypes/requiredUploadInfo'

@Resolver(AudioMetadata)
export class AudioResolver {
  public static readonly NoRoomIdKeyName = 'no-room-id'

  constructor(
    private readonly metadataRepository: Repository<AudioMetadata>,
    private readonly keyPairProvider: KeyPairProvider,
    private readonly decryptionProvider: IDecryptionProvider,
    private readonly presignedUrlProvider: IPresignedUrlProvider,
  ) {}

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
    if (endUserId !== userId) {
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
    // TODO: Should we allow audio to be uploaded if it wasn't done in Live?
    if (!roomId) {
      roomId = AudioResolver.NoRoomIdKeyName
    }
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
    // TODO: Should we allow audio to be uploaded if it wasn't done in Live?
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
    @UserID() endUserId?: string,
  ): Promise<RequiredDownloadInfo> {
    if (!endUserId) {
      throw new UnauthorizedError()
    }
    const audioMetadata = await this.metadataRepository.findOne({
      id: audioId,
      userId: endUserId, // Authorization, only allow access to their own audio.
    })

    if (!audioMetadata) {
      throw new Error(
        `Audio metadata not found for audioId(${audioId}), userId(${endUserId}).`,
      )
    }
    const roomId = audioMetadata.roomId
    if (!roomId) {
      throw new Error('No room ID is associated with the audio file.')
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

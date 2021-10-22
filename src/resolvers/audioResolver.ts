import {
  Arg,
  Authorized,
  Query,
  Resolver,
  UnauthorizedError,
} from 'type-graphql'
import { Repository } from 'typeorm'
import { AudioMetadata } from '../entities/audioMetadata'
import { ConsoleLogger, ILogger } from '../helpers/logger'
import { KeyPairProvider } from '../helpers/keyPairProvider'
import { RoomID, UserID } from '../auth/context'
import IPresignedUrlProvider from '../interfaces/presignedUrlProvider'
import { v4 } from 'uuid'
import { RequiredDownloadInfo } from '../graphqlResultTypes/requiredDownloadInfo'
import IDecryptionProvider from '../interfaces/decryptionProvider'

@Resolver(AudioMetadata)
export class AudioResolver {
  constructor(
    private readonly metadataRepository: Repository<AudioMetadata>,
    private readonly keyPairProvider: KeyPairProvider,
    private readonly decryptionProvider: IDecryptionProvider,
    private readonly presignedUrlProvider: IPresignedUrlProvider,
    private readonly logger: ILogger = new ConsoleLogger('AudioResolver'),
  ) {}

  @Authorized()
  @Query(() => [AudioMetadata])
  public async audioMetadataForUser(
    @Arg('userId') userId: string,
    @UserID() endUserId?: string,
  ): Promise<AudioMetadata[]> {
    if (endUserId !== userId) {
      throw new UnauthorizedError()
    }
    if (!userId) {
      return []
    }
    const results = await this.metadataRepository.find({ userId })
    return results
  }

  @Authorized()
  @Query(() => [AudioMetadata])
  public async audioMetadataForRoom(
    @Arg('roomId') roomId: string,
    @UserID() endUserId?: string,
  ): Promise<AudioMetadata[]> {
    if (!endUserId) {
      throw new UnauthorizedError()
    }
    const results = await this.metadataRepository.find({
      roomId,
      userId: endUserId, // Authorization, only allow access to their show users their own audio.
    })
    return results
  }

  @Authorized()
  @Query(() => String)
  public async getPublicKey(@RoomID() roomId?: string): Promise<string> {
    if (!roomId) {
      throw new UnauthorizedError()
    }
    const serverPublicKey = await this.keyPairProvider.getPublicKey(roomId)
    const base64ServerPublicKey =
      Buffer.from(serverPublicKey).toString('base64')
    return base64ServerPublicKey
  }

  @Authorized()
  @Query(() => String)
  public async getPresignedUploadUrl(
    @Arg('base64UserPublicKey') base64UserPublicKey: string,
    @Arg('base64EncryptedSymmetricKey') base64EncryptedSymmetricKey: string,
    @Arg('mimeType') mimeType: string,
    @Arg('h5pId') h5pId: string,
    @Arg('h5pSubId', () => String, { nullable: true }) h5pSubId: string | null,
    @UserID() endUserId?: string,
    @RoomID() roomId?: string,
  ): Promise<string> {
    if (!endUserId || !roomId) {
      throw new UnauthorizedError()
    }
    const audioId = v4()
    const presignedUrl = await this.presignedUrlProvider.getUploadUrl(
      audioId,
      mimeType,
    )

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
    })
    await this.metadataRepository.save(entity)

    return presignedUrl
  }

  @Authorized()
  @Query(() => RequiredDownloadInfo)
  public async getRequiredDownloadInfo(
    @Arg('audioId') audioId: string,
    @UserID() endUserId?: string,
  ): Promise<RequiredDownloadInfo> {
    if (!endUserId) {
      throw new UnauthorizedError()
    }
    const audioMetadata = await this.metadataRepository.findOne({
      id: audioId,
      userId: endUserId, // Authorization, only allow access to their show users their own audio.
    })

    if (!audioMetadata) {
      throw new Error(
        `audio metadata not found for audioId(${audioId}), userId(${endUserId})`,
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

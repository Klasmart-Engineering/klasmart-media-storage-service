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
import { ConsoleLogger, ILogger } from '../helpers/logger'
import { KeyPairProvider } from '../helpers/keyPairProvider'
import { RoomID, UserID } from '../auth/context'
import IPresignedUrlProvider from '../interfaces/presignedUrlProvider'
import { v4 } from 'uuid'
import { RequiredDownloadInfo } from '../graphqlResultTypes/requiredDownloadInfo'
import IDecryptionProvider from '../interfaces/decryptionProvider'
import { RequiredUploadInfo } from '../graphqlResultTypes/requiredUploadInfo'

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
  @Query(() => RequiredUploadInfo)
  public async getRequiredUploadInfo(
    @Arg('mimeType') mimeType: string,
    @RoomID() roomId?: string,
  ): Promise<RequiredUploadInfo> {
    if (!roomId) {
      throw new UnauthorizedError()
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
  @Mutation(() => Boolean)
  public async setMetadata(
    @Arg('audioId') audioId: string,
    @Arg('base64UserPublicKey') base64UserPublicKey: string,
    @Arg('base64EncryptedSymmetricKey') base64EncryptedSymmetricKey: string,
    @Arg('mimeType') mimeType: string,
    @Arg('h5pId') h5pId: string,
    @Arg('h5pSubId', () => String, { nullable: true }) h5pSubId: string | null,
    @UserID() endUserId?: string,
    @RoomID() roomId?: string,
  ): Promise<boolean> {
    if (!endUserId || !roomId) {
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
    })
    await this.metadataRepository.save(entity)

    return true
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

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
    @UserID() requestee?: string,
  ): Promise<AudioMetadata[]> {
    if (requestee !== userId) {
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
    @UserID() userId?: string,
  ): Promise<AudioMetadata[]> {
    if (!userId) {
      throw new UnauthorizedError()
    }
    const results = await this.metadataRepository.find({ roomId, userId })
    return results
  }

  @Authorized()
  @Query(() => String)
  public async getPublicKey(@RoomID() roomId?: string): Promise<string> {
    if (!roomId) {
      throw new UnauthorizedError()
    }
    const orgPublicKey = await this.keyPairProvider.getPublicKey(roomId)
    const encoded = Buffer.from(orgPublicKey).toString('base64')
    return encoded
  }

  @Authorized()
  @Query(() => String)
  public async getPresignedUploadUrl(
    @Arg('base64UserPublicKey') base64UserPublicKey: string,
    @Arg('base64EncryptedSymmetricKey') base64EncryptedSymmetricKey: string,
    @Arg('mimeType') mimeType: string,
    @Arg('h5pId') h5pId: string,
    @Arg('h5pSubId', () => String, { nullable: true }) h5pSubId: string | null,
    @UserID() userId?: string,
    @RoomID() roomId?: string,
  ): Promise<string> {
    if (!userId) {
      throw new Error('Unkown user')
    }
    const audioId = v4()
    const presignedUrl = await this.presignedUrlProvider.getUploadUrl(
      audioId,
      mimeType,
    )

    const entity = this.metadataRepository.create({
      id: audioId,
      userId,
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
    @UserID() userId?: string,
  ): Promise<RequiredDownloadInfo> {
    if (!userId) {
      throw new Error('Unkown user')
    }
    const audioMetadata = await this.metadataRepository.findOne({
      id: audioId,
      userId, // Authorization, only allow access to their show users their own audio
    })

    if (!audioMetadata) {
      throw new Error(`audio metadata not found for id ${audioId}`)
    }
    const roomId = audioMetadata.roomId
    if (!roomId) {
      throw new Error('Unable to decrypt audio')
    }

    const userPublicKey = Buffer.from(
      audioMetadata.base64UserPublicKey,
      'base64',
    )

    const orgPrivateKey = await this.keyPairProvider.getPrivateKey(roomId)
    const symmetricKey = this.decryptionProvider.decrypt(
      userPublicKey,
      orgPrivateKey,
      audioMetadata.base64EncryptedSymmetricKey,
    )
    const base64SymmetricKey = Buffer.from(symmetricKey).toString('base64')
    const presignedUrl = await this.presignedUrlProvider.getDownloadUrl(audioId)
    return { base64SymmetricKey, presignedUrl }
  }
}

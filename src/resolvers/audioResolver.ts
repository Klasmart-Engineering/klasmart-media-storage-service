import { Arg, Authorized, Query, Resolver } from 'type-graphql'
import { Repository } from 'typeorm'
import { AudioMetadata } from '../entities/audioMetadata'
import { ConsoleLogger, ILogger } from '../helpers/logger'
import { KeyPairProvider } from '../helpers/keyPairProvider'
import { UserID } from '../auth/context'
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
  ): Promise<AudioMetadata[]> {
    const results = await this.metadataRepository.find({ userId })
    return results
  }

  @Authorized()
  @Query(() => [AudioMetadata])
  public async audioMetadataForRoom(
    @Arg('roomId') roomId: string,
  ): Promise<AudioMetadata[]> {
    const results = await this.metadataRepository.find({ roomId })
    return results
  }

  @Authorized()
  @Query(() => String)
  public async getOrganizationPublicKey(
    @Arg('organizationId') organizationId: string,
  ): Promise<string> {
    const orgPublicKey = await this.keyPairProvider.getPublicKey(organizationId)
    const encoded = Buffer.from(orgPublicKey).toString('base64')
    return encoded
  }

  @Authorized()
  @Query(() => String)
  public async getPresignedUploadUrl(
    @Arg('base64UserPublicKey') base64UserPublicKey: string,
    @Arg('base64EncryptedSymmetricKey') base64EncryptedSymmetricKey: string,
    @Arg('roomId') roomId: string,
    @Arg('mimeType') mimeType: string,
    @Arg('h5pId') h5pId: string,
    @Arg('h5pSubId', () => String, { nullable: true }) h5pSubId: string | null,
    @UserID() userId: string,
  ): Promise<string> {
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
    @Arg('organizationId') organizationId: string,
  ): Promise<RequiredDownloadInfo> {
    const audioMetadata = await this.metadataRepository.findOne({
      id: audioId,
    })
    if (!audioMetadata) {
      throw new Error(`audio metadata not found for id ${audioId}`)
    }
    const userPublicKey = Buffer.from(
      audioMetadata.base64UserPublicKey,
      'base64',
    )
    const orgPrivateKey = await this.keyPairProvider.getPrivateKey(
      organizationId,
    )
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

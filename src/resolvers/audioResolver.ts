import { Arg, Query, Resolver } from 'type-graphql'
import { Repository } from 'typeorm'
import { AudioMetadata } from '../entities/audioMetadata'
import { ConsoleLogger, ILogger } from '../helpers/logger'
import { KeyPairProvider } from '../helpers/keyPairProvider'
import { RequiredUploadInfo } from '../graphqlResultTypes/requiredUploadInfo'
import { UserID } from '../auth/context'
import IUploadUrlProvider from '../interfaces/uploadUrlProvider'
import { AudioFileRetriever } from '../helpers/audioFileRetriever'
import { v4 } from 'uuid'

@Resolver(AudioMetadata)
export class AudioResolver {
  constructor(
    private readonly metadataRepository: Repository<AudioMetadata>,
    private readonly keyPairProvider: KeyPairProvider,
    private readonly fileRetriever: AudioFileRetriever,
    private readonly uploadUrlProvider: IUploadUrlProvider,
    private readonly logger: ILogger = new ConsoleLogger('AudioResolver'),
  ) {}

  @Query(() => [AudioMetadata])
  public async audioMetadataForUser(
    @Arg('userId') userId: string,
  ): Promise<AudioMetadata[]> {
    const results = await this.metadataRepository.find({ userId })
    return results
  }

  @Query(() => [AudioMetadata])
  public async audioMetadataForRoom(
    @Arg('roomId') roomId: string,
  ): Promise<AudioMetadata[]> {
    const results = await this.metadataRepository.find({ roomId })
    return results
  }

  @Query(() => RequiredUploadInfo)
  public async getRequiredUploadInfo(
    @Arg('organizationId') organizationId: string,
    @Arg('base64UserPublicKey') base64UserPublicKey: string,
    @Arg('roomId') roomId: string,
    @Arg('h5pId') h5pId: string,
    @Arg('h5pSubId', () => String, { nullable: true }) h5pSubId: string | null,
    @UserID() userId: string,
  ): Promise<RequiredUploadInfo> {
    const orgPublicKey = await this.keyPairProvider.getPublicKey(organizationId)
    const base64OrgPublicKey = Buffer.from(orgPublicKey).toString('base64')
    const audioId = v4()
    const presignedUrl = await this.uploadUrlProvider.getSignedUrl(audioId)

    const entity = this.metadataRepository.create({
      id: audioId,
      userId,
      base64UserPublicKey,
      creationDate: new Date(),
      roomId,
      h5pId,
      h5pSubId,
    })
    await this.metadataRepository.save(entity)

    return { base64OrgPublicKey, presignedUrl }
  }

  @Query(() => String)
  public async getAudioFile(
    @Arg('audioId') audioId: string,
    @Arg('organizationId') organizationId: string,
  ): Promise<string> {
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
    const base64AudioFile = await this.fileRetriever.getBase64AudioFile(
      audioId,
      userPublicKey,
      orgPrivateKey,
    )
    return base64AudioFile
  }
}

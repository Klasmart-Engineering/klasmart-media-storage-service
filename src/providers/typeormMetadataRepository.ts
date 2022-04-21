import { Like, Repository } from 'typeorm'
import { MediaMetadata } from '../entities/mediaMetadata'
import IMetadataRepository, {
  CreateInput,
  FindInput,
} from '../interfaces/metadataRepository'

// TODO: Consider using this custom type as a micro optimization (not selecting all the columns).
// type MetadataForDownload = {
//   roomId: string
//   mimeType: string
//   base64UserPublicKey: string
//   base64EncryptedSymmetricKey: string
// }

export default class TypeormMetadataRepository implements IMetadataRepository {
  constructor(private readonly typeormRepo: Repository<MediaMetadata>) {}

  public async findById(mediaId: string): Promise<MediaMetadata | undefined> {
    const metadata = await this.typeormRepo.findOne({
      id: mediaId,
    })
    return metadata
  }

  public find({
    userId,
    roomId,
    h5pId,
    h5pSubId,
    mediaType,
  }: FindInput): Promise<MediaMetadata[]> {
    return this.typeormRepo.find({
      where: {
        userId,
        roomId,
        h5pId,
        h5pSubId,
        mimeType: Like(`${mediaType}/%`),
      },
      order: {
        createdAt: 'ASC',
      },
    })
  }

  public async create({
    id,
    userId,
    base64UserPublicKey,
    base64EncryptedSymmetricKey,
    createdAt,
    roomId,
    mimeType,
    h5pId,
    h5pSubId,
    description,
  }: CreateInput): Promise<void> {
    const entity = this.typeormRepo.create({
      id,
      userId,
      base64UserPublicKey,
      base64EncryptedSymmetricKey,
      createdAt,
      roomId,
      mimeType,
      h5pId,
      h5pSubId,
      description,
    })
    await this.typeormRepo.insert(entity)
  }

  public async delete(mediaId: string, findInput: FindInput): Promise<void> {
    await this.typeormRepo.delete(mediaId)
  }
}

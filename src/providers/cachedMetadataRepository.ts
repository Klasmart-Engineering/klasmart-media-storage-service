import { MediaMetadata } from '../entities/mediaMetadata'
import { ICacheProvider } from '../interfaces/cacheProvider'
import IMetadataRepository, {
  CreateInput,
  FindInput,
} from '../interfaces/metadataRepository'

export default class CachedMetadataRepository implements IMetadataRepository {
  public static getFindByIdCacheKey(mediaId: string) {
    return `CachedMetadataRepository.findById-${mediaId}`
  }

  public static getFindCacheKey({
    userId,
    roomId,
    h5pId,
    h5pSubId,
    mediaType,
  }: FindInput) {
    return `CachedMetadataRepository.find-${userId}|${roomId}|${h5pId}|${h5pSubId}|${mediaType}`
  }

  constructor(
    private readonly repo: IMetadataRepository,
    private readonly cache: ICacheProvider,
  ) {}

  public async findById(mediaId: string): Promise<MediaMetadata | undefined> {
    const cacheKey = CachedMetadataRepository.getFindByIdCacheKey(mediaId)
    const cached = await this.cache.get(cacheKey)
    if (cached) {
      return JSON.parse(cached)
    }
    const metadata = await this.repo.findById(mediaId)
    await this.cache.set(cacheKey, JSON.stringify(metadata), 60 * 60)
    return metadata
  }

  public async find({
    userId,
    roomId,
    h5pId,
    h5pSubId,
    mediaType,
  }: FindInput): Promise<MediaMetadata[]> {
    const cacheKey = CachedMetadataRepository.getFindCacheKey({
      userId,
      roomId,
      h5pId,
      h5pSubId,
      mediaType,
    })
    const cached = await this.cache.get(cacheKey)
    if (cached) {
      return JSON.parse(cached, (key, value) => {
        // JSON.stringify turns Date type into an iso string so we have to convert it back.
        if (key === 'createdAt') {
          return new Date(value)
        }
        return value
      })
    }
    const entities = await this.repo.find({
      userId,
      roomId,
      h5pId,
      h5pSubId,
      mediaType,
    })
    await this.cache.set(cacheKey, JSON.stringify(entities), 60 * 60)
    return entities
  }

  public create(input: CreateInput): Promise<void> {
    return this.repo.create(input)
  }

  public delete(mediaId: string): Promise<void> {
    return this.repo.delete(mediaId)
  }
}

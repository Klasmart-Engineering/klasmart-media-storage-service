import { getRepository } from 'typeorm'
import { AudioMetadata } from '../../src/entities/audioMetadata'
import { Mutable } from '../utils/mutable'
import { v4 } from 'uuid'

export default class AudioMetadataBuilder {
  private id: string = v4()
  private userId: string = v4()
  private roomId: string | null = v4()
  private mimeType = 'audio/webm'
  private h5pId: string | null = v4()
  private h5pSubId: string | null = v4()
  private creationDate: Date = new Date()
  private base64UserPublicKey = v4()
  private base64EncryptedSymmetricKey = v4()

  public withId(value: string): this {
    this.id = value
    return this
  }

  public withUserId(value: string): this {
    this.userId = value
    return this
  }

  public withRoomId(value: string | null): this {
    this.roomId = value
    return this
  }

  public withMimeType(value: string): this {
    this.mimeType = value
    return this
  }

  public withH5pId(value: string | null): this {
    this.h5pId = value
    return this
  }

  public withH5pSubId(value: string | null): this {
    this.h5pSubId = value
    return this
  }

  public withCreationDate(value: Date): this {
    this.creationDate = value
    return this
  }

  public withBase64UserPublicKey(value: string): this {
    this.base64UserPublicKey = value
    return this
  }

  public withBase64EncryptedSymmetricKey(value: string): this {
    this.base64EncryptedSymmetricKey = value
    return this
  }

  public build(): AudioMetadata {
    const entity = new AudioMetadata()
    const mutable: Mutable<AudioMetadata> = entity
    mutable.id = this.id
    mutable.roomId = this.roomId
    mutable.mimeType = this.mimeType
    mutable.userId = this.userId
    mutable.h5pId = this.h5pId
    mutable.h5pSubId = this.h5pSubId
    mutable.creationDate = this.creationDate
    mutable.base64UserPublicKey = this.base64UserPublicKey
    mutable.base64EncryptedSymmetricKey = this.base64EncryptedSymmetricKey
    return entity
  }

  public buildAndPersist(): Promise<AudioMetadata> {
    const entity = this.build()
    return getRepository(AudioMetadata).save(entity)
  }
}

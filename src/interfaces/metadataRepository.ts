import { MediaMetadata } from '../entities/mediaMetadata'

export default interface IMetadataRepository {
  findById(mediaId: string): Promise<MediaMetadata | undefined>

  find(args: {
    userId: string
    roomId: string
    h5pId: string
    h5pSubId: string | null
    mediaType: 'audio' | 'image'
  }): Promise<MediaMetadata[]>

  create(args: {
    id: string
    userId: string
    base64UserPublicKey: string
    base64EncryptedSymmetricKey: string
    createdAt: Date
    roomId: string | undefined
    mimeType: string
    h5pId: string
    h5pSubId: string | null
    description: string
  }): Promise<void>

  delete(mediaId: string, findInput: FindInput): Promise<void>
}

export type FindInput = {
  userId: string
  roomId: string
  h5pId: string
  h5pSubId: string | null
  mediaType: 'audio' | 'image'
}

export type CreateInput = {
  id: string
  userId: string
  base64UserPublicKey: string
  base64EncryptedSymmetricKey: string
  createdAt: Date
  roomId: string | undefined
  mimeType: string
  h5pId: string
  h5pSubId: string | null
  description: string
}

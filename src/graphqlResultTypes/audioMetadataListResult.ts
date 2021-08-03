import { Field, ObjectType } from 'type-graphql'
import { AudioMetadata } from '../entities/audioMetadata'

@ObjectType()
export class AudioMetadataListResult {
  constructor(audioMetaDataItems: AudioMetadata[]) {
    this.audioMetadataItems = audioMetaDataItems
  }

  @Field(() => [AudioMetadata])
  audioMetadataItems: AudioMetadata[]
}

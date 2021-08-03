import { createUnionType } from 'type-graphql'
import {
  RoomDoesntExist,
  UnableToRetrieveAudioMetadata,
  UserDoesntExist,
} from './errorTypes'
import { AudioMetadataListResult } from './audioMetadataListResult'

export const AudioMetadataForUserUnion = createUnionType({
  name: 'AudioMetadataForUserUnion',
  types: () => [AudioMetadataListResult, UserDoesntExist] as const,
})

export const AudioMetadataForRoomUnion = createUnionType({
  name: 'AudioMetadataForRoomUnion',
  types: () =>
    [AudioMetadataListResult, UnableToRetrieveAudioMetadata] as const,
})

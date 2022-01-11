export class ErrorMessage {
  static readonly notAuthenticated =
    'User not authenticated. Please authenticate to proceed'
  static readonly noRoomIdAssociatedWithAudio =
    'No room ID is associated with the audio file.'

  static audioMetadataNotFound(audioId: string, endUserId: string): string {
    return `Audio metadata not found for audioId(${audioId}), userId(${endUserId}).`
  }
}

export class ErrorMessage {
  static readonly notAuthenticated =
    'Access denied! You need to be authorized to perform this action!'
  static readonly noRoomIdAssociatedWithAudio =
    'No room ID is associated with the audio file.'
  static readonly decryptionFailed = 'Could not decrypt message'

  static audioMetadataNotFound(audioId: string, endUserId: string): string {
    return `Audio metadata not found for audioId(${audioId}), userId(${endUserId}).`
  }

  static publicKeySaveFailed(e: unknown): string {
    return `Saving public key to S3 failed: ${e}`
  }

  static privateKeySaveFailed(e: unknown): string {
    return `Saving private key to S3 failed: ${e}`
  }
}

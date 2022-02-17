export class ErrorMessage {
  static readonly notAuthenticated =
    'Access denied! You need to be authorized to perform this action!'

  static readonly mismatchingRoomIds =
    `audio metadata was found for the provided audio ID, ` +
    `but the metadata room ID doesn't match the provided room ID.`

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

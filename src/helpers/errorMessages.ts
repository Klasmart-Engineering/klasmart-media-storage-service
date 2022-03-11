export class ErrorMessage {
  static readonly notAuthenticated =
    'Access denied! You need to be authorized to perform this action!'

  static readonly mismatchingRoomIds =
    `media metadata was found for the provided media ID, ` +
    `but the metadata room ID doesn't match the provided room ID.`

  static readonly decryptionFailed = 'Could not decrypt message'

  static mediaMetadataNotFound(mediaId: string, endUserId: string): string {
    return `Media metadata not found for mediaId(${mediaId}), userId(${endUserId}).`
  }

  static publicKeySaveFailed(e: unknown): string {
    return `Saving public key to S3 failed: ${e}`
  }

  static privateKeySaveFailed(e: unknown): string {
    return `Saving private key to S3 failed: ${e}`
  }

  static unsupportedMimeType(mimeType: string): string {
    return `Only audio and image mime types are permitted. Received: ${mimeType}`
  }
}

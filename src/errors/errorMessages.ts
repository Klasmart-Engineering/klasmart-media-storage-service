export default class ErrorMessage {
  static readonly notAuthenticated =
    'Access denied! You need to be authorized to perform this action!'

  static readonly mismatchingRoomIds =
    `media metadata was found for the provided media ID, ` +
    `but the metadata room ID doesn't match the provided room ID.`

  static readonly decryptionFailed = 'Could not decrypt message'

  static mediaMetadataNotFound(mediaId: string, endUserId: string): string {
    return `Media metadata not found for mediaId(${mediaId}), userId(${endUserId}).`
  }

  static readonly publicKeySaveFailed = 'Saving public key to S3 failed'

  static readonly privateKeySaveFailed = 'Saving private key to S3 failed'

  static readonly publicKeyGetFailed = 'Getting public key from S3 failed'

  static readonly privateKeyGetFailed = 'Getting private key from S3 failed'

  static unsupportedMimeType(mimeType: string): string {
    return `Only audio and image mime types are permitted. Received: ${mimeType}`
  }
}

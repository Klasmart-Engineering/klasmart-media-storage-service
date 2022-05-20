export const GET_SERVER_PUBLIC_KEY = `
query getServerPublicKey {
  getServerPublicKey
}
`

export const GET_REQUIRED_UPLOAD_INFO = `
query getRequiredUploadInfo(
    $base64UserPublicKey: String!,
    $base64EncryptedSymmetricKey: String!,
    $mimeType: String!,
    $h5pId: String!,
    $h5pSubId: String,
    $description: String!,
    $userId: String) {
  getRequiredUploadInfo(
    base64UserPublicKey: $base64UserPublicKey,
    base64EncryptedSymmetricKey: $base64EncryptedSymmetricKey,
    mimeType: $mimeType,
    h5pId: $h5pId,
    h5pSubId: $h5pSubId
    description: $description
    userId: $userId
  ) {
    mediaId
    presignedUrl
  }
}
`

export const AUDIO_METADATA = `
  query audioMetadata(
    $userId: String!
    $roomId: String!
    $h5pId: String!
    $h5pSubId: String
  ) {
    audioMetadata(
      userId: $userId
      roomId: $roomId
      h5pId: $h5pId
      h5pSubId: $h5pSubId
    ) {
      id
      userId
      roomId
      h5pId
      h5pSubId
      createdAt
    }
  }
`

export const MEDIA_METADATA = `
  query mediaMetadata(
    $userId: String!
    $roomId: String!
    $h5pId: String!
    $h5pSubId: String
    $mediaType: String!
  ) {
    mediaMetadata(
      userId: $userId
      roomId: $roomId
      h5pId: $h5pId
      h5pSubId: $h5pSubId
      mediaType: $mediaType
    ) {
      id
      userId
      roomId
      h5pId
      h5pSubId
      createdAt
    }
  }
`

export const GET_REQUIRED_DOWNLOAD_INFO = `
query getRequiredDownloadInfo($mediaId: String!, $roomId: String!) {
  getRequiredDownloadInfo(
    mediaId: $mediaId,
    roomId: $roomId,
  ) {
    base64SymmetricKey
    presignedUrl
  }
}
`

export const GET_REQUIRED_DOWNLOAD_INFO_FOR_METADATA = `
  query getRequiredDownloadInfoForMetadata(
    $userId: String!
    $roomId: String!
    $h5pId: String!
    $h5pSubId: String
    $mediaType: String!
  ) {
    getRequiredDownloadInfoForMetadata(
      userId: $userId
      roomId: $roomId
      h5pId: $h5pId
      h5pSubId: $h5pSubId
      mediaType: $mediaType
    ) {
      base64SymmetricKey
      presignedUrl
    }
  }
`

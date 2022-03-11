export default function createMediaFileKey(
  mediaId: string,
  mimeType: string,
): string {
  // Prefix example: image/png -> image/
  const mediaFileKeyPrefix = mimeType.substring(0, mimeType.indexOf('/') + 1)
  return `${mediaFileKeyPrefix}${mediaId}`
}

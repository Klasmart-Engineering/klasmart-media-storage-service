import { ApplicationError } from '../errors/applicationError'
import ErrorMessage from '../errors/errorMessages'

export default function createMediaFileKey(
  mediaId: string,
  mimeType: string,
): { mediaFileKey: string; mediaType: 'audio' | 'image' } {
  // mediaType example: image/png -> image
  const indexOfSlash = mimeType.indexOf('/')
  if (indexOfSlash < 0 || indexOfSlash === mimeType.length - 1) {
    throw new ApplicationError(ErrorMessage.unsupportedMimeType(mimeType))
  }
  const mediaType = mimeType.substring(0, indexOfSlash)
  if (mediaType !== 'image' && mediaType !== 'audio') {
    throw new ApplicationError(ErrorMessage.unsupportedMimeType(mimeType))
  }
  const mediaFileKey = `${mediaType}/${mediaId}`
  return { mediaFileKey, mediaType: mediaType }
}

// Consider defining a custom type.
// const supportedMediaTypes = ['audio', 'image'] as const
// type SupportedMediaTypes = typeof supportedMediaTypes[number]

// function isSupportedMediaType(
//   mediaType: string,
// ): mediaType is SupportedMediaTypes {
//   return supportedMediaTypes.includes(mediaType as SupportedMediaTypes)
// }

export default function isMimeTypeSupported(mimeType: string): boolean {
  let result = true
  if (mimeType.length <= 6) {
    result = false
  }
  if (!mimeType.startsWith('image/') && !mimeType.startsWith('audio/')) {
    result = false
  }
  return result
}

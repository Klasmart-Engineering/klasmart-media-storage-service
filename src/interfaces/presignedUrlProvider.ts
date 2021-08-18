export default interface IPresignedUrlProvider {
  getUploadUrl(audioId: string, mimeType: string): Promise<string>
  getDownloadUrl(audioId: string): Promise<string>
}

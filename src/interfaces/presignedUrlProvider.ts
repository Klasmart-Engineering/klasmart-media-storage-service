export default interface IPresignedUrlProvider {
  getUploadUrl(mediaId: string, mimeType: string): Promise<string>
  getDownloadUrl(mediaId: string): Promise<string>
}

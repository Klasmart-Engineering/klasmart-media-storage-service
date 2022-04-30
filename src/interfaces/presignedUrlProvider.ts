export default interface IPresignedUrlProvider {
  getUploadUrl(objectKey: string, mimeType: string): Promise<string>
  getDownloadUrl(objectKey: string): Promise<string>
}

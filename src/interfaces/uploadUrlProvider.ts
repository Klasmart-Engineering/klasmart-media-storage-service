export default interface IUploadUrlProvider {
  getSignedUrl(audioId: string): Promise<string>
}

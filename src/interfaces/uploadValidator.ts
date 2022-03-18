export default interface IUploadValidator {
  validate(objectKey: string, mediaId: string): void
}

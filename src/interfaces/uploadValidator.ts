export default interface IUploadValidator {
  scheduleValidation(
    objectKey: string,
    mediaId: string,
    failCallback: (mediaId: string) => Promise<unknown>,
  ): void
}

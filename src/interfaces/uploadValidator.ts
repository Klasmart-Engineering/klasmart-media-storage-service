import { FindInput } from './metadataRepository'

export default interface IUploadValidator {
  scheduleValidation(
    objectKey: string,
    mediaId: string,
    findInput: FindInput,
    failCallback: (mediaId: string, findInput: FindInput) => Promise<unknown>,
  ): void
}

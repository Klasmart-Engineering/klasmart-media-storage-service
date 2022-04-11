import IUploadValidator from '../interfaces/uploadValidator'
import MediaFileStorageChecker from './mediaFileStorageChecker'

export default class UploadValidator implements IUploadValidator {
  private readonly timers = new Map<string, NodeJS.Timeout>()

  constructor(
    private readonly mediaFileStorageChecker: MediaFileStorageChecker,
    private readonly fileValidationDelayMs: number,
  ) {}

  public scheduleValidation(
    objectKey: string,
    mediaId: string,
    failCallback: (mediaId: string) => Promise<unknown>,
  ): void {
    const timer = setTimeout(async () => {
      const exists = await this.mediaFileStorageChecker.objectExists(objectKey)
      this.timers.delete(objectKey)
      // undefined means the check was unsuccessful, so we just leave it alone.
      if (exists === true || exists === undefined) {
        return
      }
      await failCallback(mediaId)
    }, this.fileValidationDelayMs)
    this.timers.set(objectKey, timer)
  }

  public cleanUp() {
    for (const timer of this.timers.values()) {
      clearTimeout(timer)
    }
    this.timers.clear()
  }
}

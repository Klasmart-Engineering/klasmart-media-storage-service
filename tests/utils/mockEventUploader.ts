import { RequiredDownloadInfo } from '../../src/graphqlResultTypes/requiredDownloadInfo'

export class MockEventUploader {
  public async run(): Promise<void> {
    const { base64OrgPublicKey, presignedUrl } =
      await this.requestRequiredUploadInfo()
    const encryptedAudio = this.encrypt(base64OrgPublicKey)
    await this.uploadAudioFile(encryptedAudio, presignedUrl)
  }

  private requestRequiredUploadInfo(): Promise<RequiredDownloadInfo> {
    return Promise.resolve({ base64OrgPublicKey: '', presignedUrl: '' })
  }

  private encrypt(base64OrgPublicKey: string): string {
    return ''
  }

  private uploadAudioFile(
    encryptedAudio: string,
    presignedUrl: string,
  ): Promise<void> {
    return Promise.resolve()
  }
}

import { RequiredDownloadInfo } from '../graphqlResultTypes/requiredDownloadInfo'

export default interface IDownloadInfoProvider {
  getDownloadInfo(
    mediaId: string,
    roomId: string,
    endUserId: string,
  ): Promise<RequiredDownloadInfo>
}

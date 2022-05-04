import { LoadTestRequest } from '../loadTest'
import { GET_REQUIRED_DOWNLOAD_INFO } from '../../helpers/queries'

export default function getRequiredDownloadInfo(
  mediaId: string,
  roomId: string,
  authenticationToken: string,
): LoadTestRequest {
  return {
    title: 'getRequiredDownloadInfo',
    query: GET_REQUIRED_DOWNLOAD_INFO,
    method: 'POST',
    body: JSON.stringify({
      query: GET_REQUIRED_DOWNLOAD_INFO,
      variables: {
        mediaId,
        roomId,
      },
    }),
    headers: {
      'content-type': 'application/json',
      cookie: `access=${authenticationToken}`,
    },
  }
}

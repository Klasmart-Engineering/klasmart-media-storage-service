import { LoadTestRequest } from '../loadTest'
import { MEDIA_METADATA } from '../../helpers/queries'

export default function mediaMetadata(
  userId: string,
  roomId: string,
  h5pId: string,
  h5pSubId: string,
  mediaType: string,
  authenticationToken: string,
): LoadTestRequest {
  return {
    title: 'mediaMetadata',
    query: MEDIA_METADATA,
    method: 'POST',
    body: JSON.stringify({
      query: MEDIA_METADATA,
      variables: {
        userId,
        roomId,
        h5pId,
        h5pSubId,
        mediaType,
      },
    }),
    headers: {
      'content-type': 'application/json',
      cookie: `access=${authenticationToken}`,
    },
  }
}

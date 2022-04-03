import { BenchRequest } from '..'
import { AUDIO_METADATA } from '../../helpers/queries'

export default function audioMetadata(
  userId: string,
  roomId: string,
  h5pId: string,
  h5pSubId: string,
  authenticationToken: string,
): BenchRequest {
  return {
    title: 'audioMetadata',
    query: AUDIO_METADATA,
    method: 'POST',
    body: JSON.stringify({
      query: AUDIO_METADATA,
      variables: {
        userId,
        roomId,
        h5pId,
        h5pSubId,
      },
    }),
    headers: {
      'content-type': 'application/json',
      cookie: `access=${authenticationToken}`,
    },
  }
}

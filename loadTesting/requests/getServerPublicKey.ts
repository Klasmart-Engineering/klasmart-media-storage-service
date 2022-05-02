import { GET_SERVER_PUBLIC_KEY } from '../../helpers/queries'
import { LoadTestRequest } from '..'

export default function getServerPublicKey(
  authenticationToken: string,
  liveAuthorizationToken: string,
): LoadTestRequest {
  return {
    title: 'getServerPublicKey',
    query: GET_SERVER_PUBLIC_KEY,
    method: 'POST',
    body: JSON.stringify({
      query: GET_SERVER_PUBLIC_KEY,
    }),
    headers: {
      'content-type': 'application/json',
      cookie: `access=${authenticationToken}`,
      'live-authorization': liveAuthorizationToken,
    },
  }
}

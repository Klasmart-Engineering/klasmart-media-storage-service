import { BenchRequest } from '..'
import { GET_REQUIRED_UPLOAD_INFO } from '../../helpers/queries'

export default function getRequiredUploadInfo(
  base64UserPublicKey: string,
  base64EncryptedSymmetricKey: string,
  mimeType: string,
  h5pId: string,
  h5pSubId: string | undefined,
  description: string,
  authenticationToken: string,
  liveAuthorizationToken: string,
): BenchRequest {
  return {
    title: 'getRequiredUploadInfo',
    query: GET_REQUIRED_UPLOAD_INFO,
    method: 'POST',
    body: JSON.stringify({
      query: GET_REQUIRED_UPLOAD_INFO,
      variables: {
        base64UserPublicKey,
        base64EncryptedSymmetricKey,
        mimeType,
        h5pId,
        h5pSubId,
        description,
      },
    }),
    headers: {
      'content-type': 'application/json',
      cookie: `access=${authenticationToken}`,
      'live-authorization': liveAuthorizationToken,
    },
  }
}

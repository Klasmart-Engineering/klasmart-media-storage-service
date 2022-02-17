import axios, { AxiosError } from 'axios'

const authenticationToken =
  'eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEwYjc0NzkwLTk1MjgtNDViZS1iNDRmLTllMzQxMTA1YzFlOSIsImVtYWlsIjoiY2FiYXVtYW5Aa2lkc2xvb3AubGl2ZSIsImV4cCI6MTY0NDk5MzEyNCwiaXNzIjoia2lkc2xvb3AifQ.WJ3YHwE1SKjBaEFa6Hyc3WcTULN7Sx2g4KoMV19GxjITxDiefwPBEVumgpbIvv3JoXQxKOtTltnio6MkzabWPg_SDfNQn-IuZSsfeSr7-Hy8Yan7swaAuY0WugNVN_EJdu2ljewSu3_57ZvJ7CDGLPmdOh5ZnL44xCTetWaaZmmtj1sTCRy2UasO05ofo5YZ8Np1Tgh5AbURV0AgR345jAso9wlavOoUDo9XZjY-WSvhBjP2V4AdSSLQ5eVHEcuTyZ9JTKQ9bCfG4pV5QLGZ9pyKyL3A2JBnUK3bZ-q7UO3JYmvmHD5crVtdepjcvA4z4HpAlQk1sfvDOYT_C1Y6wQ'

const scheduleId = '6099c6701f42c08c3e3d45f5'

const baseUrl = `https://cms.alpha.kidsloop.net/v1/internal/schedules/${scheduleId}/relation_ids`

async function debug() {
  const response = await axios.get(baseUrl, {
    headers: {
      cookie: `access=${authenticationToken}`,
    },
  })
  console.log(JSON.stringify(response.data, null, 2))
}

debug().catch((error) => {
  console.log(`status: ${error.response?.status}; message: ${error.message}`)
  //console.log('ERROR: ' + JSON.stringify(error, null, 2))
})

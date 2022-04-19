import axios, { AxiosError } from 'axios'
import { ScheduleApi } from '../src/web/scheduleApi'

const authenticationToken =
  'eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEwYjc0NzkwLTk1MjgtNDViZS1iNDRmLTllMzQxMTA1YzFlOSIsImVtYWlsIjoiY2FiYXVtYW5Aa2lkc2xvb3AubGl2ZSIsImV4cCI6MTY0NTc1OTM1NSwiaXNzIjoia2lkc2xvb3AifQ.DTI0u8j68-CDxtm0u9aszxb-Y_fiAVU6ozVBAUteUoXCmVP9uhAIAb43nXLztluibdXKuQSh2JG5r6EmcHGr9pafnWRZ1hWEueGOCRMZL80oktkeDLFSt8wMg30kO2n1DgMGBO9DDxmJVrxo7X9cAdo2TN4OyOrqwECD_njaDDWyPWd2hThaAiXGNTfJOeamdtlL_1HezqYj2iPNOxFp8bVf59u59GPVPDa-wljYnl5j70HPkoZIOsIYYZax7Ou9Ztx_1uBBhjfTd23FioYr_PtqN3CDbqdWUbeWwk0JKXhK7ZNvv5ABP0hbTl1NakNk9JXM4uc034w-xDa_58lUxw'

const scheduleId = '62181812fcb588c47666c0fe'

const baseUrl = `https://cms.alpha.kidsloop.net/v1/internal`

async function debug() {
  const api = new ScheduleApi(axios, baseUrl)
  try {
    const response = await api.getRoomInfo(scheduleId, authenticationToken)
    console.log(JSON.stringify(response, null, 2))
  } catch (e) {
    console.log(e)
  }
}

debug().catch((error) => {
  console.log(`status: ${error.response?.status}; message: ${error.message}`)
  //console.log('ERROR: ' + JSON.stringify(error, null, 2))
})

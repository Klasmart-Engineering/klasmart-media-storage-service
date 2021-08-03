import fetch from 'node-fetch'
import AWS from 'aws-sdk'
import fs from 'fs'

async function main() {
  const s3Client = new AWS.S3({
    accessKeyId: 'SSIFG6J6NQ5TFUDGB2WY',
    secretAccessKey: 'VpzhqQkx0tYvdNthU3h2x++bBAgf+Keyi2GSRBod',
    region: 'ap-northeast-2',
    endpoint: 'localhost:9000',
    s3ForcePathStyle: true, // Needed with minio.
    signatureVersion: 'v4',
    sslEnabled: false,
  })

  const bucketParams = {
    Bucket: `audio-metadata`,
    Key: `test-object-${Math.ceil(Math.random() * 10 ** 10)}`,
    Expires: 60,
  }

  const signedUrl = await s3Client.getSignedUrlPromise(
    'putObject',
    bucketParams,
  )
  console.log('signedUrl', signedUrl)
  const response = await fetch(signedUrl, {
    method: 'PUT',
    body: fs.readFileSync('.env.example'),
  })
  console.log(`\nResponse returned by signed URL: ${await response.text()}\n`)
  return response
}

main().catch((e) => console.log(e))

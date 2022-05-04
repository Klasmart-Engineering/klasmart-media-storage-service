import fs from 'fs'
import { promisify } from 'util'
import { run } from './run'
import {
  CustomResult,
  readJsonFile,
  getTransientResultsFilePath,
  TransientResult,
} from './common'
import {
  S3Client,
  PutObjectCommand,
  CreateBucketCommand,
} from '@aws-sdk/client-s3'
import {
  generateAuthenticationToken,
  generateLiveAuthorizationToken,
} from '../helpers/generateToken'
import { getSampleEncryptedData } from '../helpers/getSampleEncryptionData'
import getRequiredDownloadInfo from './requests/getRequiredDownloadInfo'
import getServerPublicKey from './requests/getServerPublicKey'
import getRequiredUploadInfo from './requests/getRequiredUploadInfo'
import audioMetadata from './requests/audioMetadata'
import { getRepository } from 'typeorm'
import { MediaMetadata } from '../src/entities/mediaMetadata'
import { v4 } from 'uuid'
import { connectToMetadataDatabase } from '../src/initialization/connectToMetadataDatabase'
import { Request, Result } from 'autocannon'
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity'

const writeFile = promisify(fs.writeFile)
const readFile = promisify(fs.readFile)

// TODO: Get route prefix from process.env
const url = 'http://localhost:8080/media-storage/graphql'
//const url = 'http://localhost:8080/media-storage/hello'

const version = process.argv[2]
if (!version) {
  throw new Error('version must be passed as the first argument.')
}
// Examples: caching, noCaching, loggingEnabled, etc.
const category = process.argv[3]
if (!category) {
  throw new Error('category must be passed as the second argument.')
}

const transientResultsFilePath = getTransientResultsFilePath(category)

export type LoadTestRequest = {
  title: string
  query: string
  method: Request['method']
  body: Request['body']
  headers: Request['headers']
}

function mapToCustomResult(
  version: string,
  queryName: string,
  rawResult: Result,
  query: string,
): CustomResult {
  const result = {
    version,
    requests: rawResult.requests.mean.toString(),
    latency: rawResult.latency.mean.toString(),
    throughput: rawResult.throughput.mean.toString(),
    query: query,
  }
  return result
}

async function getRequests() {
  const {
    serverPrivateKey,
    serverPublicKey,
    base64UserPublicKey,
    base64EncryptedSymmetricKey,
  } = getSampleEncryptedData()
  const roomId = v4()
  const userId = v4()
  const mimeType = 'audio/webm'
  const h5pId = v4()
  const h5pSubId = v4()
  const description = 'some description'
  const authenticationToken = generateAuthenticationToken(userId)
  const liveAuthorizationToken = generateLiveAuthorizationToken(userId, roomId)
  const mediaId = v4()
  if (!process.env.METADATA_DATABASE_URL) {
    throw new Error('METADATA_DATABASE_URL must be defined.')
  }
  // TODO: Replace this hack with a better strategy.
  const dbUrl = process.env.METADATA_DATABASE_URL.replace(
    'host.docker.internal',
    'localhost',
  )
  await connectToMetadataDatabase(dbUrl)
  await getRepository(MediaMetadata).clear()
  const entries: QueryDeepPartialEntity<MediaMetadata>[] = []
  // Create 100,000 entries.
  for (let index = 0; index < 10; index++) {
    const roomId = v4()
    for (let index = 0; index < 10; index++) {
      const userId = v4()
      for (let index = 0; index < 10; index++) {
        const h5pId = v4()
        entries.push({
          id: v4(),
          base64EncryptedSymmetricKey,
          base64UserPublicKey,
          description,
          h5pId,
          h5pSubId,
          mimeType,
          roomId,
          userId,
        })
      }
    }
    await getRepository(MediaMetadata).insert(entries)
    entries.length = 0
  }
  await getRepository(MediaMetadata).insert({
    id: mediaId,
    base64EncryptedSymmetricKey,
    base64UserPublicKey,
    description,
    h5pId,
    h5pSubId,
    mimeType,
    roomId,
    userId,
  })
  if (!process.env.S3_BUCKET_ENDPOINT) {
    throw new Error('S3_BUCKET_ENDPOINT must be defined.')
  }
  // TODO: Replace this hack with a better strategy.
  const s3Url = process.env.S3_BUCKET_ENDPOINT.replace(
    'host.docker.internal',
    'localhost',
  )
  const s3Client = new S3Client({
    endpoint: s3Url,
    forcePathStyle: true,
  })
  try {
    await s3Client.send(
      new CreateBucketCommand({ Bucket: process.env.PUBLIC_KEY_BUCKET }),
    )
    await s3Client.send(
      new CreateBucketCommand({ Bucket: process.env.PRIVATE_KEY_BUCKET }),
    )
    await s3Client.send(
      new CreateBucketCommand({ Bucket: process.env.MEDIA_FILE_BUCKET }),
    )
  } catch (error) {
    // Ignore error because buckets already exist.
  }
  console.log('AWS_ACCESS_KEY_ID: ' + (process.env as any).AWS_ACCESS_KEY_ID)
  // We have to put the private key in the bucket, otherwise getRequiredDownloadInfo will fail.
  await s3Client.send(
    new PutObjectCommand({
      Bucket: process.env.PRIVATE_KEY_BUCKET,
      Key: roomId,
      Body: serverPrivateKey,
    }),
  )
  await s3Client.send(
    new PutObjectCommand({
      Bucket: process.env.PUBLIC_KEY_BUCKET,
      Key: roomId,
      Body: serverPublicKey,
    }),
  )
  const queries = [
    audioMetadata(userId, roomId, h5pId, h5pSubId, authenticationToken),
    getRequiredDownloadInfo(mediaId, roomId, authenticationToken),
    getServerPublicKey(authenticationToken, liveAuthorizationToken),
    // Put getRequiredUploadInfo last because it writes a bunch of entries to the db.
    getRequiredUploadInfo(
      base64UserPublicKey,
      base64EncryptedSymmetricKey,
      mimeType,
      h5pId,
      h5pSubId,
      description,
      authenticationToken,
      liveAuthorizationToken,
    ),
  ]
  return queries
}

function validateResult(result: Result) {
  if (result.errors > 0 || result.non2xx > 0) {
    throw new Error(`Errors occurred: ${JSON.stringify(result)}`)
  }
}

async function runLoadTests() {
  const requests = await getRequests()
  const transientResults =
    (await readJsonFile<TransientResult>(transientResultsFilePath)) ?? {}
  for (const request of requests) {
    console.log('starting warmup...')
    const warmupResults = await run({ ...request, url, duration: 5 })
    validateResult(warmupResults)
    console.log('starting actual...')
    const rawResult = await run({ ...request, url })
    const result = mapToCustomResult(
      version,
      request.title,
      rawResult,
      request.query,
    )
    transientResults[version] ??= {}
    transientResults[version][request.title] = result
    console.log(`${category}/${request.title} requests/sec: ${result.requests}`)
  }
  await writeFile(
    transientResultsFilePath,
    JSON.stringify(transientResults, null, 2),
  )
}

runLoadTests().then(() => console.log('load tests complete!'))

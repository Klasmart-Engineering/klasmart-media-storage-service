import fs from 'fs'
import path from 'path'
import { promisify } from 'util'
import { join } from 'path'
import { run } from './run'
import {
  S3Client,
  PutObjectCommand,
  CreateBucketCommand,
} from '@aws-sdk/client-s3'
import {
  generateAuthenticationToken,
  generateLiveAuthorizationToken,
} from '../helpers/generateToken'
import markdownTable from 'markdown-table'
import { getSampleEncryptedData } from '../helpers/getSampleEncryptionData'
import getRequiredDownloadInfo from './benchmarks/getRequiredDownloadInfo'
import getServerPublicKey from './benchmarks/getServerPublicKey'
import getRequiredUploadInfo from './benchmarks/getRequiredUploadInfo'
import audioMetadata from './benchmarks/audioMetadata'
import { getRepository } from 'typeorm'
import { MediaMetadata } from '../src/entities/mediaMetadata'
import { v4 } from 'uuid'
import { connectToMetadataDatabase } from '../src/initialization/connectToMetadataDatabase'
import { Request, Result } from 'autocannon'
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity'

const writeFile = promisify(fs.writeFile)

// TODO: Get route prefix from process.env
const url = 'http://localhost:8080/media-storage/graphql'
//const url = 'http://localhost:8080/media-storage/hello'
// Examples: caching, noCaching, loggingEnabled, etc.
const category = process.argv[3]
if (!category) {
  throw new Error('category must be passed as the second argument.')
}
const resultsDirectory = join(__dirname, 'rawResults', category)
if (!fs.existsSync(resultsDirectory)) {
  fs.mkdirSync(resultsDirectory, { recursive: true })
}
const versionHistoryDirectory = join(__dirname, 'versionHistory', category)
if (!fs.existsSync(versionHistoryDirectory)) {
  fs.mkdirSync(versionHistoryDirectory, { recursive: true })
}

export type BenchRequest = {
  title: string
  query: string
  method: Request['method']
  body: Request['body']
  headers: Request['headers']
}

type CustomResult = {
  version: string
  requests: number
  latency: number
  throughput: number
}

const writeResult = async (
  version: string,
  benchName: string,
  rawResult: Result,
) => {
  const result = {
    version,
    requests: rawResult.requests.mean,
    latency: rawResult.latency.mean,
    throughput: rawResult.throughput.mean,
  }
  let results: CustomResult[] = []
  if (fs.existsSync(join(resultsDirectory, `${benchName}.json`))) {
    const file = await import(`./rawResults/${category}/${benchName}.json`)
    results = file.default
  }
  results.unshift(result)
  const dest = path.join(resultsDirectory, `${benchName}.json`)
  await writeFile(dest, JSON.stringify(results, null, 2))
  return results
}

async function updateMarkdownTable(benchName: string, query: string) {
  const { default: results } = await import(
    `./rawResults/${category}/${benchName}.json`
  )
  const rows: string[][] = results.map((x: CustomResult) => [
    x.version,
    x.requests,
    x.latency,
    x.throughput,
  ])
  const table = markdownTable([
    ['version', 'requests/sec', 'latency', 'throughput'],
    ...rows,
  ])
  const queryCodeBlock = '```gql' + query + '```'
  const md = `# ${benchName}: ${category}\n\n${queryCodeBlock}\n\n${table}`
  const dest = path.join(versionHistoryDirectory, `${benchName}.md`)
  await writeFile(dest, md)
}

async function generateData() {
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
  for (let index = 0; index < 1000; index++) {
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
  const benchmarks = [
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
  return benchmarks
}

function validateResult(result: Result) {
  if (result.errors > 0 || result.non2xx > 0) {
    throw new Error(`Errors occurred: ${JSON.stringify(result)}`)
  }
}

async function runBenchmarks() {
  const version = process.argv[2]
  if (!version) {
    throw new Error('version must be passed as the first argument.')
  }
  const benchmarks = await generateData()
  for (const bench of benchmarks) {
    console.log('starting warmup...')
    const warmupResults = await run({ ...bench, url, duration: 5 })
    validateResult(warmupResults)
    console.log('starting actual...')
    const result = await run({ ...bench, url })
    const results = await writeResult(version, bench.title, result)
    await updateMarkdownTable(bench.title, bench.query)
    const prevResult = results.length > 1 ? results[1].requests : 'N/A'
    const newResult = results[0].requests
    console.log(
      `${category}/${bench.title} requests/sec: ${prevResult} -> ${newResult}`,
    )
  }
}

runBenchmarks().then(() => console.log('benchmarks complete!'))

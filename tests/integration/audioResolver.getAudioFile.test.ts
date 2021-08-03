import { expect } from 'chai'
import { Connection } from 'typeorm'
import {
  ApolloServerTestClient,
  createTestClient,
} from '../utils/createTestClient'
import { gqlTry } from '../utils/gqlTry'
import { Headers } from 'node-mocks-http'
import AWS from 'aws-sdk'
import '../utils/globalIntegrationTestHooks'
import { Config } from '../../src/helpers/config'
import { clearS3Buckets } from '../utils/s3BucketUtil'
import { connectToMetadataDatabase } from '../../src/helpers/connectToMetadataDatabase'
import createAudioServer from '../../src/helpers/createAudioServer'
import { AudioMetadata } from '../../src/entities/audioMetadata'
import AudioMetadataBuilder from '../builders/audioMetadataBuilder'
import { box } from 'tweetnacl'
import fs from 'fs'
import { encrypt } from '../../src/helpers/tweetnaclUtil'
import path from 'path'
import { v4 } from 'uuid'

describe('audioResolver.getAudioFile', () => {
  let connection: Connection
  let testClient: ApolloServerTestClient
  let s3Client: AWS.S3

  before(async () => {
    connection = await connectToMetadataDatabase(
      Config.getMetadataDatabaseUrl(),
    )
    const { app, server } = await createAudioServer()
    testClient = createTestClient(server, app)
    s3Client = Config.getS3Client()
  })

  after(async () => {
    await connection?.close()
  })

  beforeEach(async () => {
    await connection?.synchronize(true)
    await clearS3Buckets(s3Client)
  })

  context(
    '0 audio files in storage, 0 public/private keys in storage, 0 metadata entries in the database',
    () => {
      it('returns empty list', async () => {
        // Arrange
        const audioId = v4()
        const organizationId = 'org1'

        const orgKeyPair = box.keyPair()
        const userKeyPair = box.keyPair()
        const base64UserPublicKey = Buffer.from(userKeyPair.publicKey).toString(
          'base64',
        )
        const audioBlob = fs.readFileSync(path.join(__dirname, '../audioBlob'))
        const userSharedKey = box.before(
          orgKeyPair.publicKey,
          userKeyPair.secretKey,
        )
        const encryptedAudio = encrypt(userSharedKey, audioBlob)

        await s3Client
          .putObject({
            Bucket: Config.getPublicKeyBucket(),
            Key: organizationId,
            Body: Buffer.from(orgKeyPair.publicKey),
          })
          .promise()
        await s3Client
          .putObject({
            Bucket: Config.getPrivateKeyBucket(),
            Key: organizationId,
            Body: Buffer.from(orgKeyPair.secretKey),
          })
          .promise()
        await s3Client
          .putObject({
            Bucket: Config.getAudioFileBucket(),
            Key: audioId,
            Body: encryptedAudio,
          })
          .promise()
        const metadata = await new AudioMetadataBuilder()
          .withId(audioId)
          .withBase64UserPublicKey(base64UserPublicKey)
          .buildAndPersist()
        await connection.getRepository(AudioMetadata).save(metadata)

        // Act
        const base64AudioFile = await getAudioFileQuery(
          testClient,
          audioId,
          organizationId,
        )

        // Assert
        expect(base64AudioFile).to.not.be.null
        expect(base64AudioFile).to.not.be.undefined
        const expectedAudioResult = Buffer.from(audioBlob).toString('base64')
        expect(base64AudioFile).to.equal(expectedAudioResult)
      })
    },
  )
})

const GET_AUDIO_FILE = `
query getAudioFile(
    $audioId: String!
    $organizationId: String!,) {
  getAudioFile(
    audioId: $audioId,
    organizationId: $organizationId,
  )
}
`
async function getAudioFileQuery(
  testClient: ApolloServerTestClient,
  audioId: string,
  organizationId: string,
  logErrors = true,
  headers?: Headers,
) {
  const { query } = testClient

  const operation = () =>
    query({
      query: GET_AUDIO_FILE,
      variables: {
        audioId,
        organizationId,
      },
      headers,
    })

  const res = await gqlTry(operation, logErrors)
  return res.data?.getAudioFile as string
}

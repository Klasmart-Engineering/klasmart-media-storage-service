import '../utils/globalIntegrationTestHooks'
import { expect } from 'chai'
import {
  ApolloServerTestClient,
  createTestClient,
} from '../utils/createTestClient'
import { gqlTry } from '../utils/gqlTry'
import { Headers } from 'node-mocks-http'
import AWS from 'aws-sdk'
import { Config } from '../../src/initialization/config'
import { clearS3Buckets } from '../utils/s3BucketUtil'
import { AudioMetadata } from '../../src/entities/audioMetadata'
import AudioMetadataBuilder from '../builders/audioMetadataBuilder'
import { box } from 'tweetnacl'
import { encrypt } from '../../src/helpers/tweetnaclUtil'
import { v4 } from 'uuid'
import { RequiredDownloadInfo } from '../../src/graphqlResultTypes/requiredDownloadInfo'
import { generateAuthenticationToken } from '../utils/generateToken'
import { TestCompositionRoot } from './testCompositionRoot'
import { bootstrapAudioService } from '../../src/initialization/bootstrapper'
import { getRepository } from 'typeorm'

describe('audioResolver.getRequiredDownloadInfo', () => {
  let testClient: ApolloServerTestClient
  let compositionRoot: TestCompositionRoot
  let s3Client: AWS.S3

  before(async () => {
    compositionRoot = new TestCompositionRoot()
    const audioService = await bootstrapAudioService(compositionRoot)
    testClient = createTestClient(audioService.server)
    s3Client = Config.getS3Client()
  })

  after(async () => {
    await compositionRoot.cleanUp()
  })

  beforeEach(async () => {
    await clearS3Buckets(s3Client)
    await compositionRoot.clearCachedResolvers()
  })

  context(
    '1 audio file in storage, 1 key pair in storage, 1 metadata entry in the database',
    () => {
      it('returns expected presignedUrl and base64SymmetricKey', async () => {
        // Arrange
        const endUserId = v4()
        const roomId = 'room1'
        const audioId = v4()

        const serverKeyPair = box.keyPair()
        const userKeyPair = box.keyPair()
        const base64UserPublicKey = Buffer.from(userKeyPair.publicKey).toString(
          'base64',
        )
        const userSharedKey = box.before(
          serverKeyPair.publicKey,
          userKeyPair.secretKey,
        )
        const symmetricKey = box.keyPair().secretKey
        const base64EncryptedSymmetricKey = encrypt(userSharedKey, symmetricKey)

        await s3Client
          .putObject({
            Bucket: Config.getPublicKeyBucket(),
            Key: roomId,
            Body: Buffer.from(serverKeyPair.publicKey),
          })
          .promise()
        await s3Client
          .putObject({
            Bucket: Config.getPrivateKeyBucket(),
            Key: roomId,
            Body: Buffer.from(serverKeyPair.secretKey),
          })
          .promise()
        const metadata = await new AudioMetadataBuilder()
          .withId(audioId)
          .withUserId(endUserId)
          .withRoomId(roomId)
          .withBase64UserPublicKey(base64UserPublicKey)
          .withBase64EncryptedSymmetricKey(base64EncryptedSymmetricKey)
          .buildAndPersist()
        await getRepository(AudioMetadata).save(metadata)

        // Act
        const result = await getRequiredDownloadInfoQuery(
          testClient,
          audioId,
          roomId,
          {
            authentication: generateAuthenticationToken(endUserId),
          },
        )

        // Assert
        expect(result).to.not.be.null
        expect(result).to.not.be.undefined
        expect(result.presignedUrl).to.not.be.null
        expect(result.presignedUrl).to.not.be.undefined
        expect(result.presignedUrl).to.not.be.empty
        expect(result.base64SymmetricKey).to.not.be.null
        expect(result.base64SymmetricKey).to.not.be.undefined
        expect(result.base64SymmetricKey).to.not.be.empty
      })
    },
  )
})

const GET_REQUIRED_DOWNLOAD_INFO = `
query getRequiredDownloadInfo($audioId: String!, $roomId: String!) {
  getRequiredDownloadInfo(
    audioId: $audioId,
    roomId: $roomId,
  ) {
    base64SymmetricKey
    presignedUrl
  }
}
`
async function getRequiredDownloadInfoQuery(
  testClient: ApolloServerTestClient,
  audioId: string,
  roomId: string,
  headers?: Headers,
  logErrors = true,
) {
  const { query } = testClient

  const operation = () =>
    query({
      query: GET_REQUIRED_DOWNLOAD_INFO,
      variables: {
        audioId,
        roomId,
      },
      headers,
    })

  const res = await gqlTry(operation, logErrors)
  return res.data?.getRequiredDownloadInfo as RequiredDownloadInfo
}

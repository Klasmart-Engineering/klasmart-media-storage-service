import '../utils/globalIntegrationTestHooks'
import { expect } from 'chai'
import {
  ApolloServerTestClient,
  createTestClient,
} from '../utils/createTestClient'
import { gqlTry } from '../utils/gqlTry'
import { Headers } from 'node-mocks-http'
import { Config } from '../../src/initialization/config'
import {
  generateAuthenticationToken,
  generateLiveAuthorizationToken,
} from '../utils/generateToken'
import { box } from 'tweetnacl'
import { v4 } from 'uuid'
import { RequiredUploadInfo } from '../../src/graphqlResultTypes/requiredUploadInfo'
import { clearS3Buckets } from '../utils/s3BucketUtil'
import { TestCompositionRoot } from './testCompositionRoot'
import { bootstrapAudioService } from '../../src/initialization/bootstrapper'

describe('audioResolver.getRequiredUploadInfo', () => {
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

  context('server key pair does not exist in storage', () => {
    it('returns expected upload info', async () => {
      // Arrange
      const endUserId = v4()
      const roomId = 'room1'
      const mimeType = 'audio/webm'

      // Act
      const result = await getRequiredUploadInfoQuery(testClient, mimeType, {
        authentication: generateAuthenticationToken(endUserId),
        'live-authorization': generateLiveAuthorizationToken(endUserId, roomId),
      })

      // Assert
      expect(result).to.not.be.null
      expect(result).to.not.be.undefined
      expect(result).to.not.be.empty

      // Ensure keys are saved in their respective buckets.
      const publicKeyBucket = await s3Client
        .listObjectsV2({ Bucket: Config.getPublicKeyBucket() })
        .promise()
      expect(publicKeyBucket.Contents).to.not.be.undefined
      expect(publicKeyBucket.Contents).to.have.lengthOf(1)
      expect(publicKeyBucket.Contents?.[0].Size).to.equal(32)
      expect(publicKeyBucket.Contents?.[0].Key).to.equal(roomId)
      const privateKeyBucket = await s3Client
        .listObjectsV2({ Bucket: Config.getPrivateKeyBucket() })
        .promise()
      expect(privateKeyBucket.Contents).to.not.be.undefined
      expect(privateKeyBucket.Contents).to.have.lengthOf(1)
      expect(privateKeyBucket.Contents?.[0].Size).to.equal(32)
      expect(privateKeyBucket.Contents?.[0].Key).to.equal(roomId)
    })
  })

  context('server key pair exists in storage', () => {
    it('returns expected upload info', async () => {
      // Arrange
      const endUserId = v4()
      const roomId = 'room1'
      const mimeType = 'audio/webm'
      const serverKeyPair = box.keyPair()

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

      // Act
      const result = await getRequiredUploadInfoQuery(testClient, mimeType, {
        authentication: generateAuthenticationToken(endUserId),
        'live-authorization': generateLiveAuthorizationToken(endUserId, roomId),
      })

      // TODO: Separate all these assertions into separate tests.
      // Assert
      expect(result).to.not.be.null
      expect(result).to.not.be.undefined
      expect(result.audioId).to.not.be.null
      expect(result.audioId).to.not.be.undefined
      expect(result.presignedUrl).to.not.be.null
      expect(result.presignedUrl).to.not.be.undefined
      expect(result.base64ServerPublicKey).to.equal(
        Buffer.from(serverKeyPair.publicKey).toString('base64'),
      )

      // Ensure same keys are still saved in their respective buckets.
      const publicKeyBucket = await s3Client
        .listObjectsV2({ Bucket: Config.getPublicKeyBucket() })
        .promise()
      const publicKeyInBucket = await s3Client
        .getObject({ Bucket: Config.getPublicKeyBucket(), Key: roomId })
        .promise()
      expect(publicKeyBucket.Contents).to.not.be.undefined
      expect(publicKeyBucket.Contents).to.have.lengthOf(1)
      expect(publicKeyInBucket.Body).to.deep.equal(
        Buffer.from(serverKeyPair.publicKey),
      )
      const privateKeyBucket = await s3Client
        .listObjectsV2({ Bucket: Config.getPrivateKeyBucket() })
        .promise()
      const privateKeyInBucket = await s3Client
        .getObject({
          Bucket: Config.getPrivateKeyBucket(),
          Key: roomId,
        })
        .promise()
      expect(privateKeyBucket.Contents).to.not.be.undefined
      expect(privateKeyBucket.Contents).to.have.lengthOf(1)
      expect(privateKeyInBucket.Body).to.deep.equal(
        Buffer.from(serverKeyPair.secretKey),
      )
    })
  })
})

export const GET_REQUIRED_UPLOAD_INFO = `
query getRequiredUploadInfo($mimeType: String!) {
  getRequiredUploadInfo(mimeType: $mimeType) {
    audioId
    base64ServerPublicKey
    presignedUrl
  }
}
`
async function getRequiredUploadInfoQuery(
  testClient: ApolloServerTestClient,
  mimeType: string,
  headers?: Headers,
  logErrors = true,
) {
  const { query } = testClient

  const operation = () =>
    query({
      query: GET_REQUIRED_UPLOAD_INFO,
      variables: {
        mimeType,
      },
      headers,
    })

  const res = await gqlTry(operation, logErrors)
  return res.data?.getRequiredUploadInfo as RequiredUploadInfo
}

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

  context('server key pair does not exist in storage', () => {
    let result: RequiredUploadInfo
    const roomId = 'room1'

    before(async () => {
      // Clean slate
      await clearS3Buckets(s3Client)
      await compositionRoot.clearCachedResolvers()

      // Arrange
      const endUserId = v4()
      const roomId = 'room1'
      const mimeType = 'audio/webm'

      // Act
      result = await getRequiredUploadInfoQuery(testClient, mimeType, {
        authentication: generateAuthenticationToken(endUserId),
        'live-authorization': generateLiveAuthorizationToken(endUserId, roomId),
      })
    })

    it('result is not nullish', () => {
      expect(result == null).to.be.false
    })

    it('result.audioId is not nullish', () => {
      expect(result.audioId == null).to.be.false
    })

    it('result.presignedUrl is not nullish', () => {
      expect(result.presignedUrl == null).to.be.false
    })

    it('server public key is saved in S3 bucket', async () => {
      const publicKeyBucket = await s3Client
        .listObjectsV2({ Bucket: Config.getPublicKeyBucket() })
        .promise()
      expect(publicKeyBucket.Contents == null).to.be.false
      expect(publicKeyBucket.Contents).to.have.lengthOf(1)
      expect(publicKeyBucket.Contents?.[0].Size).to.equal(32)
      expect(publicKeyBucket.Contents?.[0].Key).to.equal(roomId)
    })

    it('server private key is saved in S3 bucket', async () => {
      const privateKeyBucket = await s3Client
        .listObjectsV2({ Bucket: Config.getPrivateKeyBucket() })
        .promise()
      expect(privateKeyBucket.Contents == null).to.be.false
      expect(privateKeyBucket.Contents).to.have.lengthOf(1)
      expect(privateKeyBucket.Contents?.[0].Size).to.equal(32)
      expect(privateKeyBucket.Contents?.[0].Key).to.equal(roomId)
    })
  })

  context('server key pair exists in storage', () => {
    let result: RequiredUploadInfo
    const roomId = 'room1'
    const serverKeyPair = box.keyPair()

    before(async () => {
      // Clean slate
      await clearS3Buckets(s3Client)
      await compositionRoot.clearCachedResolvers()

      // Arrange
      const endUserId = v4()
      const mimeType = 'audio/webm'

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
      result = await getRequiredUploadInfoQuery(testClient, mimeType, {
        authentication: generateAuthenticationToken(endUserId),
        'live-authorization': generateLiveAuthorizationToken(endUserId, roomId),
      })
    })

    it('result is not nullish', () => {
      expect(result == null).to.be.false
    })

    it('result.audioId is not nullish', () => {
      expect(result.audioId == null).to.be.false
    })

    it('result.presignedUrl is not nullish', () => {
      expect(result.presignedUrl == null).to.be.false
    })

    it('result.base64ServerPublicKey matches the server public key', () => {
      expect(result.base64ServerPublicKey).to.equal(
        Buffer.from(serverKeyPair.publicKey).toString('base64'),
      )
    })

    it('server public key is still saved in S3 bucket', async () => {
      const publicKeyBucket = await s3Client
        .listObjectsV2({ Bucket: Config.getPublicKeyBucket() })
        .promise()
      const publicKeyInBucket = await s3Client
        .getObject({ Bucket: Config.getPublicKeyBucket(), Key: roomId })
        .promise()
      expect(publicKeyBucket.Contents == null).to.be.false
      expect(publicKeyBucket.Contents).to.have.lengthOf(1)
      expect(publicKeyInBucket.Body).to.deep.equal(
        Buffer.from(serverKeyPair.publicKey),
      )
    })

    it('server private key is still saved in S3 bucket', async () => {
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

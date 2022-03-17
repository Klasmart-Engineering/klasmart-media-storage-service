import '../utils/globalIntegrationTestHooks'
import fetch from 'node-fetch'
import { expect } from 'chai'
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
import {
  GetObjectCommand,
  ListObjectsCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import s3BodyToBuffer from '../../src/helpers/s3BodyToBuffer'
import bootstrap from '../../src/initialization/bootstrap'
import supertest, { SuperTest } from 'supertest'

describe('mediaResolver.getRequiredUploadInfo', () => {
  let request: SuperTest<supertest.Test>
  let compositionRoot: TestCompositionRoot
  let s3Client: S3Client

  before(async () => {
    compositionRoot = new TestCompositionRoot()
    const service = await bootstrap(compositionRoot)
    request = supertest(service.server)
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
      await compositionRoot.reset()

      // Arrange
      const endUserId = v4()
      const roomId = 'room1'
      const mimeType = 'audio/webm'

      // Act
      const response = await request
        .post('/graphql')
        .set({
          ContentType: 'application/json',
          cookie: `access=${generateAuthenticationToken(endUserId)}`,
          'live-authorization': generateLiveAuthorizationToken(
            endUserId,
            roomId,
          ),
        })
        .send({
          query: GET_REQUIRED_UPLOAD_INFO,
          variables: {
            mimeType,
          },
        })
      result = response.body.data?.getRequiredUploadInfo as RequiredUploadInfo
    })

    it('result is not nullish', () => {
      expect(result == null).to.be.false
    })

    it('result.mediaId is not nullish or empty', () => {
      expect(result.mediaId == null).to.be.false
      expect(result.mediaId).to.not.be.empty
    })

    it('result.presignedUrl is not nullish or empty', () => {
      expect(result.presignedUrl == null).to.be.false
      expect(result.presignedUrl).to.not.be.empty
    })

    it('presignedUrl web request is successful', async () => {
      const response = await fetch(result.presignedUrl, {
        method: 'PUT',
        body: '123',
      })
      expect(response.ok, response.statusText).to.be.true
    })

    it('server public key is saved in S3 bucket', async () => {
      const publicKeyBucket = await s3Client.send(
        new ListObjectsCommand({ Bucket: Config.getPublicKeyBucket() }),
      )
      expect(publicKeyBucket.Contents == null).to.be.false
      expect(publicKeyBucket.Contents).to.have.lengthOf(1)
      expect(publicKeyBucket.Contents?.[0].Size).to.equal(32)
      expect(publicKeyBucket.Contents?.[0].Key).to.equal(roomId)
    })

    it('server private key is saved in S3 bucket', async () => {
      const privateKeyBucket = await s3Client.send(
        new ListObjectsCommand({ Bucket: Config.getPrivateKeyBucket() }),
      )
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
      await compositionRoot.reset()

      // Arrange
      const endUserId = v4()
      const mimeType = 'audio/webm'

      await s3Client.send(
        new PutObjectCommand({
          Bucket: Config.getPublicKeyBucket(),
          Key: roomId,
          Body: Buffer.from(serverKeyPair.publicKey),
        }),
      )
      await s3Client.send(
        new PutObjectCommand({
          Bucket: Config.getPrivateKeyBucket(),
          Key: roomId,
          Body: Buffer.from(serverKeyPair.secretKey),
        }),
      )

      // Act
      const response = await request
        .post('/graphql')
        .set({
          ContentType: 'application/json',
          cookie: `access=${generateAuthenticationToken(endUserId)}`,
          'live-authorization': generateLiveAuthorizationToken(
            endUserId,
            roomId,
          ),
        })
        .send({
          query: GET_REQUIRED_UPLOAD_INFO,
          variables: {
            mimeType,
          },
        })
      result = response.body.data?.getRequiredUploadInfo as RequiredUploadInfo
    })

    it('result is not nullish', () => {
      expect(result == null).to.be.false
    })

    it('result.mediaId is not nullish or empty', () => {
      expect(result.mediaId == null).to.be.false
      expect(result.mediaId).to.not.be.empty
    })

    it('result.presignedUrl is not nullish or empty', () => {
      expect(result.presignedUrl == null).to.be.false
      expect(result.presignedUrl).to.not.be.empty
    })

    it('presignedUrl web request is successful', async () => {
      const response = await fetch(result.presignedUrl, {
        method: 'PUT',
        body: '123',
      })
      expect(response.ok, response.statusText).to.be.true
    })

    it('result.base64ServerPublicKey matches the server public key', () => {
      expect(result.base64ServerPublicKey).to.equal(
        Buffer.from(serverKeyPair.publicKey).toString('base64'),
      )
    })

    it('server public key is still saved in S3 bucket', async () => {
      const publicKeyBucket = await s3Client.send(
        new ListObjectsCommand({ Bucket: Config.getPublicKeyBucket() }),
      )
      const publicKeyInBucket = await s3Client.send(
        new GetObjectCommand({
          Bucket: Config.getPublicKeyBucket(),
          Key: roomId,
        }),
      )
      const publicKeyBuffer = await s3BodyToBuffer(publicKeyInBucket.Body)

      expect(publicKeyBucket.Contents == null).to.be.false
      expect(publicKeyBucket.Contents).to.have.lengthOf(1)
      expect(publicKeyBuffer).to.deep.equal(
        Buffer.from(serverKeyPair.publicKey),
      )
    })

    it('server private key is still saved in S3 bucket', async () => {
      const privateKeyBucket = await s3Client.send(
        new ListObjectsCommand({ Bucket: Config.getPrivateKeyBucket() }),
      )
      const privateKeyInBucket = await s3Client.send(
        new GetObjectCommand({
          Bucket: Config.getPrivateKeyBucket(),
          Key: roomId,
        }),
      )
      const privateKeyBuffer = await s3BodyToBuffer(privateKeyInBucket.Body)

      expect(privateKeyBucket.Contents).to.not.be.undefined
      expect(privateKeyBucket.Contents).to.have.lengthOf(1)
      expect(privateKeyBuffer).to.deep.equal(
        Buffer.from(serverKeyPair.secretKey),
      )
    })
  })
})

export const GET_REQUIRED_UPLOAD_INFO = `
query getRequiredUploadInfo($mimeType: String!) {
  getRequiredUploadInfo(mimeType: $mimeType) {
    mediaId
    base64ServerPublicKey
    presignedUrl
  }
}
`

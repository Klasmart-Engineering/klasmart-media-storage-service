import '../../../utils/globalIntegrationTestHooks'
import fetch from 'node-fetch'
import expect from '../../../utils/chaiAsPromisedSetup'
import MediaMetadataBuilder from '../../../builders/mediaMetadataBuilder'
import { generateAuthenticationToken } from '../../../../helpers/generateToken'
import { v4 } from 'uuid'
import Substitute from '@fluffy-spoon/substitute'
import AuthorizationProvider from '../../../../src/providers/authorizationProvider'
import { TestCompositionRoot } from '../../testCompositionRoot'
import supertest, { SuperTest } from 'supertest'
import bootstrap from '../../../../src/initialization/bootstrap'
import { GET_REQUIRED_DOWNLOAD_INFO_FOR_METADATA } from '../../../../helpers/queries'
import { RequiredDownloadInfo } from '../../../../src/graphqlResultTypes/requiredDownloadInfo'
import { clearS3Buckets } from '../../../utils/s3BucketUtil'
import AppConfig from '../../../../src/config/config'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { box } from 'tweetnacl'
import { encrypt } from '../../../../src/helpers/tweetnaclUtil'

describe('downloadResolverExtended.getRequiredDownloadInfoForMetadata', () => {
  let request: SuperTest<supertest.Test>
  let compositionRoot: TestCompositionRoot
  let s3Client: S3Client
  let requestPath: string

  before(async () => {
    compositionRoot = new TestCompositionRoot()
    const service = await bootstrap(compositionRoot)
    request = supertest(service.server)
    requestPath = service.path
    s3Client = AppConfig.default.s3Client
  })

  after(async () => {
    await compositionRoot.cleanUp()
  })

  beforeEach(async () => {
    await compositionRoot.reset()
  })

  context(
    '1 audio file in storage, 1 key pair in storage, 1 metadata entry in the database',
    () => {
      let result: RequiredDownloadInfo

      before(async () => {
        // Clean slate
        await clearS3Buckets(s3Client)
        await compositionRoot.reset()

        // Arrange
        const endUserId = v4()
        const roomId = 'room1'
        const mediaId = v4()
        const userId = v4()
        const h5pId = 'h5p1'
        const h5pSubId = 'h5pSub1'
        const mediaType = 'audio'

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

        await new MediaMetadataBuilder()
          .withId(mediaId)
          .withRoomId(roomId)
          .withUserId(userId)
          .withMimeType('audio/webm')
          .withH5pId(h5pId)
          .withH5pSubId(h5pSubId)
          .withBase64UserPublicKey(base64UserPublicKey)
          .withBase64EncryptedSymmetricKey(base64EncryptedSymmetricKey)
          .buildAndPersist()

        await s3Client.send(
          new PutObjectCommand({
            Bucket: AppConfig.default.publicKeyBucket,
            Key: roomId,
            Body: Buffer.from(serverKeyPair.publicKey),
          }),
        )
        await s3Client.send(
          new PutObjectCommand({
            Bucket: AppConfig.default.privateKeyBucket,
            Key: roomId,
            Body: Buffer.from(serverKeyPair.secretKey),
          }),
        )
        await s3Client.send(
          new PutObjectCommand({
            Bucket: AppConfig.default.mediaFileBucket,
            Key: `audio/${mediaId}`,
            Body: Buffer.from([1, 2, 3]),
          }),
        )

        const authenticationToken = generateAuthenticationToken(endUserId)

        const authorizationProvider = Substitute.for<AuthorizationProvider>()
        compositionRoot.authorizationProvider = authorizationProvider
        authorizationProvider
          .isAuthorized(endUserId, roomId, authenticationToken)
          .resolves(true)

        // Act
        const response = await request
          .post(requestPath)
          .set({
            ContentType: 'application/json',
            cookie: `access=${authenticationToken}`,
          })
          .send({
            query: GET_REQUIRED_DOWNLOAD_INFO_FOR_METADATA,
            variables: {
              userId,
              roomId,
              h5pId,
              h5pSubId,
              mediaType,
            },
          })
        result = response.body.data
          ?.getRequiredDownloadInfoForMetadata as RequiredDownloadInfo
      })

      it('result is not nullish', () => {
        expect(result == null).to.be.false
      })

      it('result.presignedUrl is not nullish or empty', () => {
        expect(result.presignedUrl == null).to.be.false
        expect(result.presignedUrl).to.not.be.empty
      })

      it('presignedUrl web request is successful', async () => {
        const response = await fetch(result.presignedUrl, { method: 'GET' })
        expect(
          response.ok,
          `status: ${response.statusText}: ${await response.text()}`,
        ).to.be.true
      })

      it('result.base64SymmetricKey is not nullish or empty', async () => {
        expect(result.base64SymmetricKey == null).to.be.false
        expect(result.base64SymmetricKey).to.not.be.empty
      })
    },
  )

  context('0 matching media files', () => {
    let result: RequiredDownloadInfo
    let errors: unknown

    before(async () => {
      // Clean slate
      await clearS3Buckets(s3Client)
      await compositionRoot.reset()

      // Arrange
      const endUserId = v4()
      const roomId = 'room1'
      const userId = v4()
      const h5pId = 'h5p1'
      const h5pSubId = 'h5pSub1'
      const mediaType = 'audio'

      const authenticationToken = generateAuthenticationToken(endUserId)

      const authorizationProvider = Substitute.for<AuthorizationProvider>()
      compositionRoot.authorizationProvider = authorizationProvider
      authorizationProvider
        .isAuthorized(endUserId, roomId, authenticationToken)
        .resolves(true)

      // Act
      const response = await request
        .post(requestPath)
        .set({
          ContentType: 'application/json',
          cookie: `access=${authenticationToken}`,
        })
        .send({
          query: GET_REQUIRED_DOWNLOAD_INFO_FOR_METADATA,
          variables: {
            userId,
            roomId,
            h5pId,
            h5pSubId,
            mediaType,
          },
        })
      result = response.body.data
        ?.getRequiredDownloadInfoForMetadata as RequiredDownloadInfo
      errors = response.body.errors
    })

    it('result is null', () => {
      expect(result).to.be.null
    })

    it('errors is undefined', () => {
      expect(errors).to.be.undefined
    })
  })
})

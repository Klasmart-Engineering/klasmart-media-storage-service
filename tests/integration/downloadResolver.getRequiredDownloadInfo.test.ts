import '../utils/globalIntegrationTestHooks'
import fetch from 'node-fetch'
import { expect } from 'chai'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { Config } from '../../src/initialization/config'
import { clearS3Buckets } from '../utils/s3BucketUtil'
import { MediaMetadata } from '../../src/entities/mediaMetadata'
import MediaMetadataBuilder from '../builders/mediaMetadataBuilder'
import { box } from 'tweetnacl'
import { encrypt } from '../../src/helpers/tweetnaclUtil'
import { v4 } from 'uuid'
import { RequiredDownloadInfo } from '../../src/graphqlResultTypes/requiredDownloadInfo'
import { generateAuthenticationToken } from '../utils/generateToken'
import { TestCompositionRoot } from './testCompositionRoot'
import bootstrap from '../../src/initialization/bootstrap'
import { getRepository } from 'typeorm'
import supertest, { SuperTest } from 'supertest'

describe('downloadResolver.getRequiredDownloadInfo', () => {
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
        await s3Client.send(
          new PutObjectCommand({
            Bucket: Config.getMediaFileBucket(),
            Key: `audio/${mediaId}`,
            Body: Buffer.from([1, 2, 3]),
          }),
        )
        const metadata = await new MediaMetadataBuilder()
          .withId(mediaId)
          .withUserId(endUserId)
          .withRoomId(roomId)
          .withBase64UserPublicKey(base64UserPublicKey)
          .withBase64EncryptedSymmetricKey(base64EncryptedSymmetricKey)
          .buildAndPersist()
        await getRepository(MediaMetadata).save(metadata)

        // Act
        const response = await request
          .post('/graphql')
          .set({
            ContentType: 'application/json',
            cookie: `access=${generateAuthenticationToken(endUserId)}`,
          })
          .send({
            query: GET_REQUIRED_DOWNLOAD_INFO,
            variables: {
              mediaId,
              roomId,
            },
          })
        result = response.body.data
          ?.getRequiredDownloadInfo as RequiredDownloadInfo
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
})

const GET_REQUIRED_DOWNLOAD_INFO = `
query getRequiredDownloadInfo($mediaId: String!, $roomId: String!) {
  getRequiredDownloadInfo(
    mediaId: $mediaId,
    roomId: $roomId,
  ) {
    base64SymmetricKey
    presignedUrl
  }
}
`
// async function getRequiredDownloadInfoQuery(
//   testClient: ApolloServerTestClient,
//   mediaId: string,
//   roomId: string,
//   headers?: Headers,
//   logErrors = true,
// ) {
//   const { query } = testClient

//   const operation = () =>
//     query({
//       query: GET_REQUIRED_DOWNLOAD_INFO,
//       variables: {
//         mediaId,
//         roomId,
//       },
//       headers,
//     })

//   const res = await gqlTry(operation, logErrors)
//   return res.data?.getRequiredDownloadInfo as RequiredDownloadInfo
// }

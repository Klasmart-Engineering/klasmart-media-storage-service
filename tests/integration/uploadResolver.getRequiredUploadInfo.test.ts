import '../utils/globalIntegrationTestHooks'
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
import { S3Client } from '@aws-sdk/client-s3'
import bootstrap from '../../src/initialization/bootstrap'
import supertest, { SuperTest } from 'supertest'
import { getRepository } from 'typeorm'
import { MediaMetadata } from '../../src/entities/mediaMetadata'

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

  // TODO: Split assertions like other tests.
  context(
    'authentication token userId does not match authorization token userId',
    () => {
      it('saves metadata to db with roomId equal to null', async () => {
        // Clean slate
        await clearS3Buckets(s3Client)
        await compositionRoot.reset()

        // Arrange
        const base64UserPublicKey = Buffer.from(
          box.keyPair().publicKey,
        ).toString('base64')
        const base64EncryptedSymmetricKey = Buffer.from(
          box.keyPair().secretKey,
        ).toString('base64')
        const roomId = 'room1'
        const mimeType = 'audio/webm'
        const h5pId = 'h5p1'
        const h5pSubId = 'h5pSub1'
        const description = 'some description'
        const endUserId = v4()
        const endUserId2 = v4()

        // Act
        const response = await request
          .post('/graphql')
          .set({
            ContentType: 'application/json',
            cookie: `access=${generateAuthenticationToken(endUserId)}`,
            'live-authorization': generateLiveAuthorizationToken(
              endUserId2,
              roomId,
            ),
          })
          .send({
            query: GET_REQUIRED_UPLOAD_INFO,
            variables: {
              base64UserPublicKey,
              base64EncryptedSymmetricKey,
              mimeType,
              h5pId,
              h5pSubId,
              description,
            },
          })
        const result = response.body.data
          ?.getRequiredUploadInfo as RequiredUploadInfo

        // Assert
        // Ensure metadata is saved in the database.
        const count = await getRepository(MediaMetadata).count()
        expect(count).to.equal(1)
        const entry = await getRepository(MediaMetadata).findOne({
          where: {
            // ******* main difference ******* //
            roomId: null,
            // ******* main difference ******* //
            mimeType,
            h5pId,
            h5pSubId,
            userId: endUserId,
            base64UserPublicKey,
            base64EncryptedSymmetricKey,
          },
        })
        expect(entry == null).to.be.false
      })
    },
  )

  // TODO: Split assertions like other tests.
  // TODO: Fix this. Fastify returns the array as a comma separated list...
  context.skip(
    'live authorization header is an array rather than a string; second element is not valid',
    () => {
      it('uses first element; returns true, and saves metadata to db', async () => {
        // Clean slate
        await clearS3Buckets(s3Client)
        await compositionRoot.reset()

        // Arrange
        const base64UserPublicKey = Buffer.from(
          box.keyPair().publicKey,
        ).toString('base64')
        const base64EncryptedSymmetricKey = Buffer.from(
          box.keyPair().secretKey,
        ).toString('base64')
        const roomId = 'room1'
        const mimeType = 'audio/webm'
        const h5pId = 'h5p1'
        const h5pSubId = 'h5pSub1'
        const description = 'some description'
        const endUserId = v4()

        // Act
        const response = await request
          .post('/graphql')
          .set({
            ContentType: 'application/json',
            cookie: `access=${generateAuthenticationToken(endUserId)}`,
            'live-authorization': [
              generateLiveAuthorizationToken(endUserId, roomId),
              'some other value',
            ],
          })
          .send({
            query: GET_REQUIRED_UPLOAD_INFO,
            variables: {
              base64UserPublicKey,
              base64EncryptedSymmetricKey,
              mimeType,
              h5pId,
              h5pSubId,
              description,
            },
          })
        const result = response.body.data
          ?.getRequiredUploadInfo as RequiredUploadInfo

        // Assert
        // Ensure metadata is saved in the database.
        const count = await getRepository(MediaMetadata).count()
        expect(count).to.equal(1)
        const entry1 = await getRepository(MediaMetadata).findOne()
        const entry = await getRepository(MediaMetadata).findOne({
          where: {
            roomId,
            mimeType,
            h5pId,
            h5pSubId,
            userId: endUserId,
            base64UserPublicKey,
            base64EncryptedSymmetricKey,
          },
        })
        expect(entry == null).to.be.false
      })
    },
  )
})

export const GET_REQUIRED_UPLOAD_INFO = `
query getRequiredUploadInfo(
    $base64UserPublicKey: String!,
    $base64EncryptedSymmetricKey: String!,
    $mimeType: String!,
    $h5pId: String!,
    $h5pSubId: String,
    $description: String!) {
  getRequiredUploadInfo(
    base64UserPublicKey: $base64UserPublicKey,
    base64EncryptedSymmetricKey: $base64EncryptedSymmetricKey,
    mimeType: $mimeType,
    h5pId: $h5pId,
    h5pSubId: $h5pSubId
    description: $description
  ) {
    mediaId
    presignedUrl
  }
}
`

import '../utils/globalIntegrationTestHooks'
import { expect } from 'chai'
import {
  ApolloServerTestClient,
  createTestClient,
} from '../utils/createTestClient'
import { gqlTry } from '../utils/gqlTry'
import { Headers } from 'node-mocks-http'
import { box } from 'tweetnacl'
import { MediaMetadata } from '../../src/entities/mediaMetadata'
import { S3Client } from '@aws-sdk/client-s3'
import { Config } from '../../src/initialization/config'
import { clearS3Buckets } from '../utils/s3BucketUtil'
import {
  generateAuthenticationToken,
  generateLiveAuthorizationToken,
} from '../utils/generateToken'
import { v4 } from 'uuid'
import { TestCompositionRoot } from './testCompositionRoot'
import { bootstrapService } from '../../src/initialization/bootstrapper'
import { getRepository } from 'typeorm'

describe('mediaResolver.setMetadata', () => {
  let testClient: ApolloServerTestClient
  let compositionRoot: TestCompositionRoot
  let s3Client: S3Client

  before(async () => {
    compositionRoot = new TestCompositionRoot()
    const mediaStorageService = await bootstrapService(compositionRoot)
    testClient = createTestClient(mediaStorageService.server)
    s3Client = Config.getS3Client()
  })

  after(async () => {
    await compositionRoot.cleanUp()
  })

  beforeEach(async () => {
    await clearS3Buckets(s3Client)
    await compositionRoot.reset()
  })

  context(
    '0 audio files in storage, 0 key pairs in storage, 0 metadata entries in the database',
    () => {
      it('returns true, and saves metadata to db', async () => {
        // Arrange
        const base64UserPublicKey = Buffer.from(
          box.keyPair().publicKey,
        ).toString('base64')
        const base64EncryptedSymmetricKey = Buffer.from(
          box.keyPair().secretKey,
        ).toString('base64')
        const roomId = 'room1'
        const mediaId = v4()
        const mimeType = 'audio/webm'
        const h5pId = 'h5p1'
        const h5pSubId = 'h5pSub1'
        const description = 'some description'
        const endUserId = v4()

        // Act
        const success = await setMetadataQuery(
          testClient,
          mediaId,
          base64UserPublicKey,
          base64EncryptedSymmetricKey,
          mimeType,
          h5pId,
          h5pSubId,
          description,
          {
            authentication: generateAuthenticationToken(endUserId),
            'live-authorization': generateLiveAuthorizationToken(
              endUserId,
              roomId,
            ),
          },
        )

        // Assert
        expect(success).to.be.true

        // Ensure metadata is saved in the database.
        const count = await getRepository(MediaMetadata).count()
        expect(count).to.equal(1)
        const entry = await getRepository(MediaMetadata).findOne({
          where: {
            id: mediaId,
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

  context(
    'authentication token userId does not match authorization token userId',
    () => {
      it('returns true, and saves metadata to db with roomId equal to null', async () => {
        // Arrange
        const base64UserPublicKey = Buffer.from(
          box.keyPair().publicKey,
        ).toString('base64')
        const base64EncryptedSymmetricKey = Buffer.from(
          box.keyPair().secretKey,
        ).toString('base64')
        const roomId = 'room1'
        const mediaId = v4()
        const mimeType = 'audio/webm'
        const h5pId = 'h5p1'
        const h5pSubId = 'h5pSub1'
        const description = 'some description'
        const endUserId = v4()
        const endUserId2 = v4()

        // Act
        const success = await setMetadataQuery(
          testClient,
          mediaId,
          base64UserPublicKey,
          base64EncryptedSymmetricKey,
          mimeType,
          h5pId,
          h5pSubId,
          description,
          {
            // ******* main difference ******* //
            authentication: generateAuthenticationToken(endUserId),
            'live-authorization': generateLiveAuthorizationToken(
              endUserId2,
              roomId,
            ),
            // ******* main difference ******* //
          },
        )

        expect(success).to.be.true

        // Ensure metadata is saved in the database.
        const count = await getRepository(MediaMetadata).count()
        expect(count).to.equal(1)
        const entry = await getRepository(MediaMetadata).findOne({
          where: {
            id: mediaId,
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

  context(
    'live authorization header is an array rather than a string; second element is not valid',
    () => {
      it('uses first element; returns true, and saves metadata to db', async () => {
        // Arrange
        const base64UserPublicKey = Buffer.from(
          box.keyPair().publicKey,
        ).toString('base64')
        const base64EncryptedSymmetricKey = Buffer.from(
          box.keyPair().secretKey,
        ).toString('base64')
        const roomId = 'room1'
        const mediaId = v4()
        const mimeType = 'audio/webm'
        const h5pId = 'h5p1'
        const h5pSubId = 'h5pSub1'
        const description = 'some description'
        const endUserId = v4()

        // Act
        const success = await setMetadataQuery(
          testClient,
          mediaId,
          base64UserPublicKey,
          base64EncryptedSymmetricKey,
          mimeType,
          h5pId,
          h5pSubId,
          description,
          {
            authentication: generateAuthenticationToken(endUserId),
            'live-authorization': [
              generateLiveAuthorizationToken(endUserId, roomId),
              'some other value',
            ],
          },
        )

        // Assert
        expect(success).to.be.true

        // Ensure metadata is saved in the database.
        const count = await getRepository(MediaMetadata).count()
        expect(count).to.equal(1)
        const entry = await getRepository(MediaMetadata).findOne({
          where: {
            id: mediaId,
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

export const SET_METADATA = `
mutation setMetadata(
    $mediaId: String!,
    $base64UserPublicKey: String!,
    $base64EncryptedSymmetricKey: String!,
    $mimeType: String!,
    $h5pId: String!,
    $h5pSubId: String,
    $description: String!) {
  setMetadata(
    mediaId: $mediaId,
    base64UserPublicKey: $base64UserPublicKey,
    base64EncryptedSymmetricKey: $base64EncryptedSymmetricKey,
    mimeType: $mimeType,
    h5pId: $h5pId,
    h5pSubId: $h5pSubId
    description: $description
  )
}
`
async function setMetadataQuery(
  testClient: ApolloServerTestClient,
  mediaId: string,
  base64UserPublicKey: string,
  base64EncryptedSymmetricKey: string,
  mimeType: string,
  h5pId: string,
  h5pSubId: string | null,
  description: string,
  headers?: Headers,
  logErrors = true,
) {
  const { mutate } = testClient

  const operation = () =>
    mutate({
      mutation: SET_METADATA,
      variables: {
        mediaId: mediaId,
        base64UserPublicKey,
        base64EncryptedSymmetricKey,
        mimeType,
        h5pId,
        h5pSubId,
        description,
      },
      headers,
    })

  const res = await gqlTry(operation, logErrors)
  return res.data?.setMetadata as boolean
}

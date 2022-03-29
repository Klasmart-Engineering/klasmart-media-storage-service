import '../../utils/globalIntegrationTestHooks'
import fetch from 'node-fetch'
import { expect } from 'chai'
import { Config } from '../../../src/initialization/config'
import {
  generateAuthenticationToken,
  generateLiveAuthorizationToken,
} from '../../utils/generateToken'
import { box } from 'tweetnacl'
import { v4 } from 'uuid'
import { RequiredUploadInfo } from '../../../src/graphqlResultTypes/requiredUploadInfo'
import { clearS3Buckets } from '../../utils/s3BucketUtil'
import { TestCompositionRoot } from '../testCompositionRoot'
import { S3Client } from '@aws-sdk/client-s3'
import bootstrap from '../../../src/initialization/bootstrap'
import supertest, { SuperTest } from 'supertest'
import { getRepository } from 'typeorm'
import { MediaMetadata } from '../../../src/entities/mediaMetadata'
import UploadValidator from '../../../src/providers/uploadValidator'
import { MediaFileStorageChecker } from '../../../src/providers/mediaFileStorageChecker'
import Substitute, { Arg } from '@fluffy-spoon/substitute'
import { delay } from '../../../src/helpers/delay'

describe('uploadResolver.getRequiredUploadInfo', () => {
  let request: SuperTest<supertest.Test>
  let compositionRoot: TestCompositionRoot
  let s3Client: S3Client

  // Common input
  const base64UserPublicKey = Buffer.from(box.keyPair().publicKey).toString(
    'base64',
  )
  const base64EncryptedSymmetricKey = Buffer.from(
    box.keyPair().secretKey,
  ).toString('base64')

  before(async () => {
    compositionRoot = new TestCompositionRoot()
    const service = await bootstrap(compositionRoot)
    request = supertest(service.server)
    s3Client = Config.getS3Client()
  })

  after(async () => {
    await compositionRoot.cleanUp()
  })

  context('empty database', () => {
    let result: RequiredUploadInfo
    const endUserId = v4()
    const roomId = 'room1'
    const mimeType = 'audio/webm'
    const h5pId = 'h5p1'
    const h5pSubId = 'h5pSub1'
    const description = 'some description'

    before(async () => {
      // Clean slate
      await clearS3Buckets(s3Client)
      await compositionRoot.reset()

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
            base64UserPublicKey,
            base64EncryptedSymmetricKey,
            mimeType,
            h5pId,
            h5pSubId,
            description,
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
      expect(
        response.ok,
        `status: ${response.statusText}: ${await response.text()}`,
      ).to.be.true
    })

    it('saves metadata to db', async () => {
      // Assert
      // Ensure metadata is saved in the database.
      const count = await getRepository(MediaMetadata).count()
      expect(count).to.equal(1)
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
  })

  context(
    'empty database; fileValidationDelayMs is set to 100ms; check after 110ms',
    () => {
      const endUserId = v4()
      const roomId = 'room1'
      const mimeType = 'audio/webm'
      const h5pId = 'h5p1'
      const h5pSubId = 'h5pSub1'
      const description = 'some description'

      before(async () => {
        // Clean slate
        await clearS3Buckets(s3Client)
        await compositionRoot.reset()

        const fileValidationDelayMs = 100
        const mediaFileStorageChecker =
          Substitute.for<MediaFileStorageChecker>()
        mediaFileStorageChecker.objectExists(Arg.any()).resolves(false)
        compositionRoot['uploadValidator'] = new UploadValidator(
          mediaFileStorageChecker,
          fileValidationDelayMs,
        )

        // Act
        await request
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
              base64UserPublicKey,
              base64EncryptedSymmetricKey,
              mimeType,
              h5pId,
              h5pSubId,
              description,
            },
          })
        const count = await getRepository(MediaMetadata).count()
        expect(count).to.equal(1)
        await delay(110)
      })

      it('db is still empty', async () => {
        // Assert
        // Ensure metadata is saved in the database.
        const count = await getRepository(MediaMetadata).count()
        expect(count).to.equal(0)
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
        expect(entry).to.be.undefined
      })
    },
  )

  context(
    'authentication token userId does not match authorization token userId',
    () => {
      let result: RequiredUploadInfo
      const roomId = 'room1'
      const mimeType = 'audio/webm'
      const h5pId = 'h5p1'
      const h5pSubId = 'h5pSub1'
      const description = 'some description'
      const endUserId = v4()
      const endUserId2 = v4()

      before(async () => {
        // Clean slate
        await clearS3Buckets(s3Client)
        await compositionRoot.reset()

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
        expect(
          response.ok,
          `status: ${response.statusText}: ${await response.text()}`,
        ).to.be.true
      })

      it('saves metadata to db with roomId equal to null', async () => {
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

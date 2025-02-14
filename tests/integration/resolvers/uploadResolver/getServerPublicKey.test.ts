import '../../../utils/globalIntegrationTestHooks'
import { expect } from 'chai'
import AppConfig from '../../../../src/config/config'
import {
  generateAuthenticationToken,
  generateLiveAuthorizationToken,
} from '../../../../helpers/generateToken'
import { box } from 'tweetnacl'
import { v4 } from 'uuid'
import { clearS3Buckets } from '../../../utils/s3BucketUtil'
import { TestCompositionRoot } from '../../testCompositionRoot'
import {
  GetObjectCommand,
  ListObjectsCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import s3BodyToBuffer from '../../../../src/helpers/s3BodyToBuffer'
import bootstrap from '../../../../src/initialization/bootstrap'
import supertest, { SuperTest } from 'supertest'
import { GET_SERVER_PUBLIC_KEY } from '../../../../helpers/queries'
import { restoreEnvVar, setEnvVar } from '../../../utils/setAndRestoreEnvVar'

describe('uploadResolver.getServerPublicKey', () => {
  let request: SuperTest<supertest.Test>
  let compositionRoot: TestCompositionRoot
  let s3Client: S3Client
  let requestPath: string

  async function setup() {
    compositionRoot = new TestCompositionRoot()
    const service = await bootstrap(compositionRoot)
    request = supertest(service.server)
    requestPath = service.path
    s3Client = AppConfig.default.s3Client
    await clearS3Buckets(s3Client)
    // TODO: Clear Redis and Typeorm like compositionRoot.reset does.
  }

  context('server key pair does not exist in storage', () => {
    let result: string
    const roomId = 'room1'

    before(async () => {
      await setup()

      // Arrange
      const roomId = 'room1'
      const endUserId = v4()

      // Act
      const response = await request
        .post(requestPath)
        .set({
          ContentType: 'application/json',
          cookie: `access=${generateAuthenticationToken(endUserId)}`,
          'live-authorization': generateLiveAuthorizationToken(
            endUserId,
            roomId,
          ),
        })
        .send({
          query: GET_SERVER_PUBLIC_KEY,
        })
      result = response.body.data.getServerPublicKey as string
    })

    after(async () => {
      await compositionRoot.cleanUp()
    })

    it('result is not nullish', () => {
      expect(result == null).to.be.false
    })

    it('server public key is saved in S3 bucket', async () => {
      const publicKeyBucket = await s3Client.send(
        new ListObjectsCommand({ Bucket: AppConfig.default.publicKeyBucket }),
      )
      expect(publicKeyBucket.Contents == null).to.be.false
      expect(publicKeyBucket.Contents).to.have.lengthOf(1)
      expect(publicKeyBucket.Contents?.[0].Size).to.equal(32)
      expect(publicKeyBucket.Contents?.[0].Key).to.equal(roomId)
    })

    it('server private key is saved in S3 bucket', async () => {
      const privateKeyBucket = await s3Client.send(
        new ListObjectsCommand({ Bucket: AppConfig.default.privateKeyBucket }),
      )
      expect(privateKeyBucket.Contents == null).to.be.false
      expect(privateKeyBucket.Contents).to.have.lengthOf(1)
      expect(privateKeyBucket.Contents?.[0].Size).to.equal(32)
      expect(privateKeyBucket.Contents?.[0].Key).to.equal(roomId)
    })
  })

  context(
    'SERVER_IMPL = apollo; server key pair does not exist in storage',
    () => {
      let result: string
      const roomId = 'room1'
      let originalServerImpl: string | undefined

      before(async () => {
        originalServerImpl = setEnvVar('SERVER_IMPL', 'apollo-express')
        await setup()

        // Arrange
        const roomId = 'room1'
        const endUserId = v4()

        // Act
        const response = await request
          .post(requestPath)
          .set({
            ContentType: 'application/json',
            cookie: `access=${generateAuthenticationToken(endUserId)}`,
            'live-authorization': generateLiveAuthorizationToken(
              endUserId,
              roomId,
            ),
          })
          .send({
            query: GET_SERVER_PUBLIC_KEY,
          })
        result = response.body.data.getServerPublicKey as string
      })

      after(async () => {
        restoreEnvVar('SERVER_IMPL', originalServerImpl)
        await compositionRoot.cleanUp()
      })

      it('result is not nullish', () => {
        expect(result == null).to.be.false
      })

      it('server public key is saved in S3 bucket', async () => {
        const publicKeyBucket = await s3Client.send(
          new ListObjectsCommand({ Bucket: AppConfig.default.publicKeyBucket }),
        )
        expect(publicKeyBucket.Contents == null).to.be.false
        expect(publicKeyBucket.Contents).to.have.lengthOf(1)
        expect(publicKeyBucket.Contents?.[0].Size).to.equal(32)
        expect(publicKeyBucket.Contents?.[0].Key).to.equal(roomId)
      })

      it('server private key is saved in S3 bucket', async () => {
        const privateKeyBucket = await s3Client.send(
          new ListObjectsCommand({
            Bucket: AppConfig.default.privateKeyBucket,
          }),
        )
        expect(privateKeyBucket.Contents == null).to.be.false
        expect(privateKeyBucket.Contents).to.have.lengthOf(1)
        expect(privateKeyBucket.Contents?.[0].Size).to.equal(32)
        expect(privateKeyBucket.Contents?.[0].Key).to.equal(roomId)
      })
    },
  )

  context('server key pair exists in storage', () => {
    let result: string
    const roomId = 'room1'
    const serverKeyPair = box.keyPair()

    before(async () => {
      await setup()

      // Arrange
      const roomId = 'room1'
      const endUserId = v4()

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

      after(async () => {
        await compositionRoot.cleanUp()
      })

      // Act
      const response = await request
        .post(requestPath)
        .set({
          ContentType: 'application/json',
          cookie: `access=${generateAuthenticationToken(endUserId)}`,
          'live-authorization': generateLiveAuthorizationToken(
            endUserId,
            roomId,
          ),
        })
        .send({
          query: GET_SERVER_PUBLIC_KEY,
        })
      result = response.body.data.getServerPublicKey as string
    })

    it('result is not nullish', () => {
      expect(result == null).to.be.false
    })

    it('base64ServerPublicKey matches the server public key', () => {
      expect(result).to.equal(
        Buffer.from(serverKeyPair.publicKey).toString('base64'),
      )
    })

    it('server public key is still saved in S3 bucket', async () => {
      const publicKeyBucket = await s3Client.send(
        new ListObjectsCommand({ Bucket: AppConfig.default.publicKeyBucket }),
      )
      const publicKeyInBucket = await s3Client.send(
        new GetObjectCommand({
          Bucket: AppConfig.default.publicKeyBucket,
          Key: roomId,
        }),
      )
      const publicKeyBuffer = await s3BodyToBuffer(publicKeyInBucket.Body)

      expect(publicKeyBucket.Contents == null).to.be.false
      expect(publicKeyBucket.Contents).to.have.lengthOf(1)
      expect(publicKeyBuffer).to.deep.equal(serverKeyPair.publicKey)
    })

    it('server private key is still saved in S3 bucket', async () => {
      const privateKeyBucket = await s3Client.send(
        new ListObjectsCommand({ Bucket: AppConfig.default.privateKeyBucket }),
      )
      const privateKeyInBucket = await s3Client.send(
        new GetObjectCommand({
          Bucket: AppConfig.default.privateKeyBucket,
          Key: roomId,
        }),
      )
      const privateKeyBuffer = await s3BodyToBuffer(privateKeyInBucket.Body)

      expect(privateKeyBucket.Contents == null).to.be.false
      expect(privateKeyBucket.Contents).to.have.lengthOf(1)
      expect(privateKeyBuffer).to.deep.equal(
        Buffer.from(serverKeyPair.secretKey),
      )
    })
  })
})

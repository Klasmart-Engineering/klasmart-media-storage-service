import { expect } from 'chai'
import { Connection } from 'typeorm'
import {
  ApolloServerTestClient,
  createTestClient,
} from '../utils/createTestClient'
import { gqlTry } from '../utils/gqlTry'
import { Headers } from 'node-mocks-http'
import { RequiredUploadInfo } from '../../src/graphqlResultTypes/requiredUploadInfo'
import { box } from 'tweetnacl'
import { AudioMetadata } from '../../src/entities/audioMetadata'
import AWS from 'aws-sdk'
import '../utils/globalIntegrationTestHooks'
import { Config } from '../../src/helpers/config'
import { clearS3Buckets } from '../utils/s3BucketUtil'
import createAudioServer from '../../src/helpers/createAudioServer'
import { connectToMetadataDatabase } from '../../src/helpers/connectToMetadataDatabase'
import { generateToken } from '../utils/generateToken'

describe('audioResolver.getRequiredUploadInfo', () => {
  let connection: Connection
  let testClient: ApolloServerTestClient
  let s3Client: AWS.S3

  before(async () => {
    connection = await connectToMetadataDatabase(
      Config.getMetadataDatabaseUrl(),
    )
    const { app, server } = await createAudioServer()
    testClient = createTestClient(server, app)
    s3Client = Config.getS3Client()
  })

  after(async () => {
    await connection?.close()
  })

  beforeEach(async () => {
    await connection?.synchronize(true)
    await clearS3Buckets(s3Client)
  })

  context(
    '0 audio files in storage, 0 public/private keys in storage, 0 metadata entries in the database',
    () => {
      it('returns required upload info', async () => {
        // Arrange
        const organizationId = 'org1'
        const base64UserPublicKey = Buffer.from(
          box.keyPair().publicKey,
        ).toString('base64')
        const roomId = 'room1'
        const h5pId = 'h5p1'
        const h5pSubId = 'h5pSub1'
        const userId = 'user1'

        // Act
        const result = await getRequiredUploadInfoQuery(
          testClient,
          organizationId,
          base64UserPublicKey,
          roomId,
          h5pId,
          h5pSubId,
          { authorization: generateToken(userId) },
        )

        // Assert
        expect(result).to.not.be.null
        expect(result).to.not.be.undefined
        expect(result.presignedUrl).is.not.empty
        expect(result.base64OrgPublicKey).is.not.empty

        // Ensure metadata is saved in the database.
        const count = await connection.getRepository(AudioMetadata).count()
        expect(count).to.equal(1)
        const entry = await connection.getRepository(AudioMetadata).findOne({
          where: { roomId, h5pId, h5pSubId, userId, base64UserPublicKey },
        })
        expect(entry).to.not.be.undefined

        // Ensure keys are saved in their respective buckets.
        const publicKeyBucket = await s3Client
          .listObjectsV2({ Bucket: Config.getPublicKeyBucket() })
          .promise()
        expect(publicKeyBucket.Contents).to.not.be.undefined
        expect(publicKeyBucket.Contents).to.have.lengthOf(1)
        expect(publicKeyBucket.Contents?.[0].Size).to.equal(32)
        const privateKeyBucket = await s3Client
          .listObjectsV2({ Bucket: Config.getPrivateKeyBucket() })
          .promise()
        expect(privateKeyBucket.Contents).to.not.be.undefined
        expect(privateKeyBucket.Contents).to.have.lengthOf(1)
        expect(privateKeyBucket.Contents?.[0].Size).to.equal(32)
      })
    },
  )
})

export const GET_REQUIRED_UPLOAD_INFO = `
query getRequiredUploadInfo(
    $organizationId: String!,
    $base64UserPublicKey: String!,
    $roomId: String!,
    $h5pId: String!,
    $h5pSubId: String) {
  getRequiredUploadInfo(
    organizationId: $organizationId,
    base64UserPublicKey: $base64UserPublicKey,
    roomId: $roomId,
    h5pId: $h5pId,
    h5pSubId: $h5pSubId
  ) {
    base64OrgPublicKey
    presignedUrl
  }
}
`
async function getRequiredUploadInfoQuery(
  testClient: ApolloServerTestClient,
  organizationId: string,
  base64UserPublicKey: string,
  roomId: string,
  h5pId: string,
  h5pSubId: string | null,
  headers?: Headers,
  logErrors = true,
) {
  const { query } = testClient

  const operation = () =>
    query({
      query: GET_REQUIRED_UPLOAD_INFO,
      variables: {
        organizationId,
        base64UserPublicKey,
        roomId,
        h5pId,
        h5pSubId,
      },
      headers,
    })

  const res = await gqlTry(operation, logErrors)
  return res.data?.getRequiredUploadInfo as RequiredUploadInfo
}

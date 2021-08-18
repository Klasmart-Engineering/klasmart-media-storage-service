import { expect } from 'chai'
import { Connection } from 'typeorm'
import {
  ApolloServerTestClient,
  createTestClient,
} from '../utils/createTestClient'
import { gqlTry } from '../utils/gqlTry'
import { Headers } from 'node-mocks-http'
import { box } from 'tweetnacl'
import { AudioMetadata } from '../../src/entities/audioMetadata'
import AWS from 'aws-sdk'
import '../utils/globalIntegrationTestHooks'
import { Config } from '../../src/helpers/config'
import { clearS3Buckets } from '../utils/s3BucketUtil'
import createAudioServer from '../../src/helpers/createAudioServer'
import { connectToMetadataDatabase } from '../../src/helpers/connectToMetadataDatabase'
import { generateToken } from '../utils/generateToken'

describe('audioResolver.getPresignedUploadUrl', () => {
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
    '0 audio files in storage, 0 key pairs in storage, 0 metadata entries in the database',
    () => {
      it('returns required upload url', async () => {
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
        const userId = 'user1'

        // Act
        const result = await getPresignedUploadUrlQuery(
          testClient,
          base64UserPublicKey,
          base64EncryptedSymmetricKey,
          roomId,
          mimeType,
          h5pId,
          h5pSubId,
          { authorization: generateToken(userId) },
        )

        // Assert
        expect(result).to.not.be.null
        expect(result).to.not.be.undefined
        expect(result).is.not.empty

        // Ensure metadata is saved in the database.
        const count = await connection.getRepository(AudioMetadata).count()
        expect(count).to.equal(1)
        const entry = await connection.getRepository(AudioMetadata).findOne({
          where: {
            roomId,
            mimeType,
            h5pId,
            h5pSubId,
            userId,
            base64UserPublicKey,
            base64EncryptedSymmetricKey,
          },
        })
        expect(entry).to.not.be.undefined
      })
    },
  )
})

export const GET_PRESIGNED_UPLOAD_URL = `
query getPresignedUploadUrl(
    $base64UserPublicKey: String!,
    $base64EncryptedSymmetricKey: String!,
    $roomId: String!,
    $mimeType: String!,
    $h5pId: String!,
    $h5pSubId: String) {
  getPresignedUploadUrl(
    base64UserPublicKey: $base64UserPublicKey,
    base64EncryptedSymmetricKey: $base64EncryptedSymmetricKey,
    roomId: $roomId,
    mimeType: $mimeType,
    h5pId: $h5pId,
    h5pSubId: $h5pSubId
  )
}
`
async function getPresignedUploadUrlQuery(
  testClient: ApolloServerTestClient,
  base64UserPublicKey: string,
  base64EncryptedSymmetricKey: string,
  roomId: string,
  mimeType: string,
  h5pId: string,
  h5pSubId: string | null,
  headers?: Headers,
  logErrors = true,
) {
  const { query } = testClient

  const operation = () =>
    query({
      query: GET_PRESIGNED_UPLOAD_URL,
      variables: {
        base64UserPublicKey,
        base64EncryptedSymmetricKey,
        roomId,
        mimeType,
        h5pId,
        h5pSubId,
      },
      headers,
    })

  const res = await gqlTry(operation, logErrors)
  return res.data?.getPresignedUploadUrl as string
}

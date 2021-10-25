import '../utils/globalIntegrationTestHooks'
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
import { Config } from '../../src/helpers/config'
import { clearS3Buckets } from '../utils/s3BucketUtil'
import createAudioServer from '../../src/helpers/createAudioServer'
import { connectToMetadataDatabase } from '../../src/helpers/connectToMetadataDatabase'
import {
  generateAuthenticationToken,
  generateLiveAuthorizationToken,
} from '../utils/generateToken'
import { v4 } from 'uuid'

describe('audioResolver.setMetadata', () => {
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
        const audioId = v4()
        const mimeType = 'audio/webm'
        const h5pId = 'h5p1'
        const h5pSubId = 'h5pSub1'
        const description = 'some description'
        const endUserId = v4()

        // Act
        const success = await setMetadataQuery(
          testClient,
          audioId,
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
        expect(success).to.not.be.null
        expect(success).to.not.be.undefined
        expect(success).to.be.true

        // Ensure metadata is saved in the database.
        const count = await connection.getRepository(AudioMetadata).count()
        expect(count).to.equal(1)
        const entry = await connection.getRepository(AudioMetadata).findOne({
          where: {
            id: audioId,
            roomId,
            mimeType,
            h5pId,
            h5pSubId,
            userId: endUserId,
            base64UserPublicKey,
            base64EncryptedSymmetricKey,
          },
        })
        expect(entry).to.not.be.undefined
      })
    },
  )
})

export const SET_METADATA = `
mutation setMetadata(
    $audioId: String!,
    $base64UserPublicKey: String!,
    $base64EncryptedSymmetricKey: String!,
    $mimeType: String!,
    $h5pId: String!,
    $h5pSubId: String,
    $description: String!) {
  setMetadata(
    audioId: $audioId,
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
  audioId: string,
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
        audioId,
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

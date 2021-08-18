import { expect } from 'chai'
import { Connection } from 'typeorm'
import {
  ApolloServerTestClient,
  createTestClient,
} from '../utils/createTestClient'
import { gqlTry } from '../utils/gqlTry'
import { Headers } from 'node-mocks-http'
import { Config } from '../../src/helpers/config'
import { connectToMetadataDatabase } from '../../src/helpers/connectToMetadataDatabase'
import createAudioServer from '../../src/helpers/createAudioServer'
import { generateToken } from '../utils/generateToken'
import { box } from 'tweetnacl'
import path from 'path'
import fs from 'fs'
import { decrypt } from '../../src/helpers/tweetnaclUtil'

describe('audioResolver.getOrganizationPublicKey', () => {
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
  })

  context('organization key pair does not exist in storage', () => {
    it('returns expected organization public key', async () => {
      // Arrange
      const userId = 'user1'
      const organizationId = 'org1'

      // Act
      const result = await getOrganizationPublicKeyQuery(
        testClient,
        organizationId,
        {
          authorization: generateToken(userId),
        },
      )

      // Assert
      expect(result).to.not.be.null
      expect(result).to.not.be.undefined
      expect(result).to.not.be.empty

      // Ensure keys are saved in their respective buckets.
      const publicKeyBucket = await s3Client
        .listObjectsV2({ Bucket: Config.getPublicKeyBucket() })
        .promise()
      expect(publicKeyBucket.Contents).to.not.be.undefined
      expect(publicKeyBucket.Contents).to.have.lengthOf(1)
      expect(publicKeyBucket.Contents?.[0].Size).to.equal(32)
      expect(publicKeyBucket.Contents?.[0].Key).to.equal(organizationId)
      const privateKeyBucket = await s3Client
        .listObjectsV2({ Bucket: Config.getPrivateKeyBucket() })
        .promise()
      expect(privateKeyBucket.Contents).to.not.be.undefined
      expect(privateKeyBucket.Contents).to.have.lengthOf(1)
      expect(privateKeyBucket.Contents?.[0].Size).to.equal(32)
      expect(privateKeyBucket.Contents?.[0].Key).to.equal(organizationId)
    })
  })

  context('organization key pair exists in storage', () => {
    it('returns expected organization public key', async () => {
      // Arrange
      const userId = 'user1'
      const organizationId = 'org1'
      const orgKeyPair = box.keyPair()
      await s3Client
        .putObject({
          Bucket: Config.getPublicKeyBucket(),
          Key: organizationId,
          Body: Buffer.from(orgKeyPair.publicKey),
        })
        .promise()
      await s3Client
        .putObject({
          Bucket: Config.getPrivateKeyBucket(),
          Key: organizationId,
          Body: Buffer.from(orgKeyPair.secretKey),
        })
        .promise()

      // Act
      const result = await getOrganizationPublicKeyQuery(
        testClient,
        organizationId,
        {
          authorization: generateToken(userId),
        },
      )

      // Assert
      const expected = Buffer.from(orgKeyPair.publicKey).toString('base64')
      expect(result).to.equal(expected)

      // Ensure same keys are still saved in their respective buckets.
      const publicKeyBucket = await s3Client
        .listObjectsV2({ Bucket: Config.getPublicKeyBucket() })
        .promise()
      const publicKeyInBucket = await s3Client
        .getObject({ Bucket: Config.getPublicKeyBucket(), Key: organizationId })
        .promise()
      expect(publicKeyBucket.Contents).to.not.be.undefined
      expect(publicKeyBucket.Contents).to.have.lengthOf(1)
      expect(publicKeyInBucket.Body).to.deep.equal(
        Buffer.from(orgKeyPair.publicKey),
      )
      const privateKeyBucket = await s3Client
        .listObjectsV2({ Bucket: Config.getPrivateKeyBucket() })
        .promise()
      const privateKeyInBucket = await s3Client
        .getObject({
          Bucket: Config.getPrivateKeyBucket(),
          Key: organizationId,
        })
        .promise()
      expect(privateKeyBucket.Contents).to.not.be.undefined
      expect(privateKeyBucket.Contents).to.have.lengthOf(1)
      expect(privateKeyInBucket.Body).to.deep.equal(
        Buffer.from(orgKeyPair.secretKey),
      )
    })
  })
})

export const GET_ORGANIZATION_PUBLIC_KEY = `
query getOrganizationPublicKey(
    $organizationId: String!) {
  getOrganizationPublicKey(
    organizationId: $organizationId,
  )
}
`
async function getOrganizationPublicKeyQuery(
  testClient: ApolloServerTestClient,
  organizationId: string,
  headers?: Headers,
  logErrors = true,
) {
  const { query } = testClient

  const operation = () =>
    query({
      query: GET_ORGANIZATION_PUBLIC_KEY,
      variables: {
        organizationId,
      },
      headers,
    })

  const res = await gqlTry(operation, logErrors)
  return res.data?.getOrganizationPublicKey as string
}

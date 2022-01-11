import '../utils/globalIntegrationTestHooks'
import { expect } from 'chai'
import { Connection } from 'typeorm'
import {
  ApolloServerTestClient,
  createTestClient,
} from '../utils/createTestClient'
import { gqlTry } from '../utils/gqlTry'
import { Headers } from 'node-mocks-http'
import AudioMetadataBuilder from '../builders/audioMetadataBuilder'
import { Config } from '../../src/initialization/config'
import { connectToMetadataDatabase } from '../../src/initialization/connectToMetadataDatabase'
import createAudioServer from '../../src/initialization/createAudioServer'
import {
  generateAuthenticationToken,
  generateLiveAuthorizationToken,
} from '../utils/generateToken'
import { v4 } from 'uuid'
import { AudioMetadata } from '../../src/entities/audioMetadata'

describe('audioResolver', () => {
  let connection: Connection
  let testClient: ApolloServerTestClient

  before(async () => {
    connection = await connectToMetadataDatabase(
      Config.getMetadataDatabaseUrl(),
    )
    const { app, server } = await createAudioServer()
    testClient = createTestClient(server, app)
  })

  after(async () => {
    await connection?.close()
  })

  beforeEach(async () => {
    await connection?.synchronize(true)
  })

  describe('audioMetadata', () => {
    context('0 database entries', () => {
      it('returns empty list', async () => {
        // Arrange
        const roomId = 'room1'
        const userId = v4()
        const endUserId = userId
        const h5pId = 'h5p1'
        const h5pSubId = 'h5pSub1'

        // Act
        const result = await audioMetadataQuery(
          testClient,
          userId,
          roomId,
          h5pId,
          h5pSubId,
          {
            authentication: generateAuthenticationToken(endUserId),
            'live-authorization': generateLiveAuthorizationToken(
              endUserId,
              roomId,
            ),
          },
        )

        // Assert
        expect(result).to.not.be.null
        expect(result).to.not.be.undefined
      })
    })

    context('1 database entry which does not match provided arguments', () => {
      it('returns empty list', async () => {
        // Arrange
        const roomId = 'room1'
        const userId = v4()
        const endUserId = userId
        const h5pId = 'h5p1'
        const h5pSubId = 'h5pSub1'
        await new AudioMetadataBuilder().buildAndPersist()

        // Act
        const result = await audioMetadataQuery(
          testClient,
          userId,
          roomId,
          h5pId,
          h5pSubId,
          {
            authentication: generateAuthenticationToken(endUserId),
            'live-authorization': generateLiveAuthorizationToken(
              endUserId,
              roomId,
            ),
          },
        )

        // Assert
        expect(result).to.not.be.null
        expect(result).to.not.be.undefined
      })
    })

    context('2 database entries, 1 of which matches provided arguments', () => {
      it('returns list containing 1 item', async () => {
        // Arrange
        const roomId = 'room1'
        const userId = v4()
        const endUserId = userId
        const h5pId = 'h5p1'
        const h5pSubId = 'h5pSub1'
        await new AudioMetadataBuilder().buildAndPersist()
        const matchingAudioMetadata = await new AudioMetadataBuilder()
          .withRoomId(roomId)
          .withUserId(userId)
          .withH5pId(h5pId)
          .withH5pSubId(h5pSubId)
          .buildAndPersist()

        // Act
        const result = await audioMetadataQuery(
          testClient,
          userId,
          roomId,
          h5pId,
          h5pSubId,
          {
            authentication: generateAuthenticationToken(endUserId),
            'live-authorization': generateLiveAuthorizationToken(
              endUserId,
              roomId,
            ),
          },
        )

        // Assert
        expect(result).to.not.be.null
        expect(result).to.not.be.undefined
        expect(result).to.deep.equal([
          {
            id: matchingAudioMetadata.id,
            userId,
            roomId,
            h5pId,
            h5pSubId,
            creationDate: matchingAudioMetadata.creationDate.toISOString(),
          },
        ])
      })
    })
  })
})

export const AUDIO_METADATA = `
query audioMetadata(
    $userId: String!
    $roomId: String!
    $h5pId: String!
    $h5pSubId: String) {
  audioMetadata(
    userId: $userId
    roomId: $roomId
    h5pId: $h5pId
    h5pSubId: $h5pSubId
  ) {
    id
    userId
    roomId
    h5pId
    h5pSubId
    creationDate
  }
}
`
async function audioMetadataQuery(
  testClient: ApolloServerTestClient,
  userId: string,
  roomId: string,
  h5pId: string,
  h5pSubId: string,
  headers?: Headers,
  logErrors = true,
) {
  const { query } = testClient

  const operation = () =>
    query({
      query: AUDIO_METADATA,
      variables: { userId, roomId, h5pId, h5pSubId },
      headers,
    })

  const res = await gqlTry(operation, logErrors)
  return res.data?.audioMetadata as AudioMetadata[]
}

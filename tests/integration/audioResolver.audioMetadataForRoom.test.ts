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
import { Config } from '../../src/helpers/config'
import { connectToMetadataDatabase } from '../../src/helpers/connectToMetadataDatabase'
import createAudioServer from '../../src/helpers/createAudioServer'
import {
  generateAuthenticationToken,
  generateLiveAuthorizationToken,
} from '../utils/generateToken'
import { v4 } from 'uuid'

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

  describe('audioMetadataForRoom', () => {
    context('0 database entries', () => {
      it('returns empty list', async () => {
        // Arrange
        const roomId = 'room1'
        const userId = v4()

        // Act
        const result = await audioMetadataForRoomQuery(testClient, roomId, {
          authentication: generateAuthenticationToken(userId),
          'live-authorization': generateLiveAuthorizationToken(userId, roomId),
        })

        // Assert
        expect(result).to.not.be.null
        expect(result).to.not.be.undefined
      })
    })

    context('1 database entry which does not match roomId', () => {
      it('returns empty list', async () => {
        // Arrange
        const roomId = 'room1'
        const userId = v4()
        await new AudioMetadataBuilder().buildAndPersist()

        // Act
        const result = await audioMetadataForRoomQuery(testClient, roomId, {
          authentication: generateAuthenticationToken(userId),
          'live-authorization': generateLiveAuthorizationToken(userId, roomId),
        })

        // Assert
        expect(result).to.not.be.null
        expect(result).to.not.be.undefined
      })
    })

    context('2 database entries, 1 of which matches roomId', () => {
      it('returns list containing 1 item', async () => {
        // Arrange
        const roomId = 'room1'
        const userId = v4()
        await new AudioMetadataBuilder().buildAndPersist()
        const matchingAudioMetadata = await new AudioMetadataBuilder()
          .withRoomId(roomId)
          .buildAndPersist()

        // Act
        const result = await audioMetadataForRoomQuery(testClient, roomId, {
          authentication: generateAuthenticationToken(userId),
          'live-authorization': generateLiveAuthorizationToken(userId, roomId),
        })

        // Assert
        expect(result).to.not.be.null
        expect(result).to.not.be.undefined
        //expect(result).to.equal(matchingAudioMetadata)
      })
    })
  })
})

export const AUDIO_METADATA_FOR_ROOM = `
query audioMetadataForRoom($roomId: String!) {
  audioMetadataForRoom(roomId: $roomId) {
    id
    userId
    roomId
    h5pId
    h5pSubId
    creationDate
  }
}
`
async function audioMetadataForRoomQuery(
  testClient: ApolloServerTestClient,
  roomId: string,
  headers?: Headers,
  logErrors = true,
) {
  const { query } = testClient

  const operation = () =>
    query({
      query: AUDIO_METADATA_FOR_ROOM,
      variables: { roomId: roomId },
      headers,
    })

  const res = await gqlTry(operation, logErrors)
  return res.data?.audioMetadataForRoom
}

export const AUDIO_METADATA_FOR_USER = `
query audioMetadataForUser($userId: String!) {
  audioMetadataForUser(userId: $userId) {
    id
    userId
    roomId
    h5pId
    h5pSubId
    creationDate
  }
}
`
async function audioMetadataForUserQuery(
  testClient: ApolloServerTestClient,
  userId: string,
  logErrors = true,
  headers?: Headers,
) {
  const { query } = testClient

  const operation = () =>
    query({
      query: AUDIO_METADATA_FOR_USER,
      variables: { userId: userId },
      headers,
    })

  const res = await gqlTry(operation, logErrors)
  return res.data?.audioMetadataForUser
}

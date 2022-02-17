import '../utils/globalIntegrationTestHooks'
import expect from '../utils/chaiAsPromisedSetup'
import {
  ApolloServerTestClient,
  createTestClient,
} from '../utils/createTestClient'
import { gqlTry } from '../utils/gqlTry'
import { Headers } from 'node-mocks-http'
import AudioMetadataBuilder from '../builders/audioMetadataBuilder'
import {
  generateAuthenticationToken,
  generateLiveAuthorizationToken,
} from '../utils/generateToken'
import { v4 } from 'uuid'
import { AudioMetadata } from '../../src/entities/audioMetadata'
import { ErrorMessage } from '../../src/helpers/errorMessages'
import Substitute from '@fluffy-spoon/substitute'
import AuthorizationProvider from '../../src/helpers/authorizationProvider'
import { TestCompositionRoot } from './testCompositionRoot'
import { bootstrapAudioService } from '../../src/initialization/bootstrapper'

describe('audioResolver', () => {
  let testClient: ApolloServerTestClient
  let compositionRoot: TestCompositionRoot

  before(async () => {
    compositionRoot = new TestCompositionRoot()
    const audioService = await bootstrapAudioService(compositionRoot)
    testClient = createTestClient(audioService.server)
  })

  after(async () => {
    await compositionRoot.cleanUp()
  })

  beforeEach(async () => {
    await compositionRoot.clearCachedResolvers()
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
        const authenticationToken = generateAuthenticationToken(endUserId)

        const authorizationProvider = Substitute.for<AuthorizationProvider>()
        compositionRoot.authorizationProvider = authorizationProvider
        authorizationProvider
          .isAuthorized(endUserId, roomId, authenticationToken)
          .resolves(true)

        // Act
        const result = await audioMetadataQuery(
          testClient,
          userId,
          roomId,
          h5pId,
          h5pSubId,
          {
            authentication: authenticationToken,
          },
        )

        // Assert
        expect(result).to.deep.equal([])
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
        const authenticationToken = generateAuthenticationToken(endUserId)

        const authorizationProvider = Substitute.for<AuthorizationProvider>()
        compositionRoot.authorizationProvider = authorizationProvider
        authorizationProvider
          .isAuthorized(endUserId, roomId, authenticationToken)
          .resolves(true)

        // Act
        const result = await audioMetadataQuery(
          testClient,
          userId,
          roomId,
          h5pId,
          h5pSubId,
          {
            authentication: authenticationToken,
          },
        )

        // Assert
        expect(result).to.deep.equal([])
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
        const authenticationToken = generateAuthenticationToken(endUserId)

        const authorizationProvider = Substitute.for<AuthorizationProvider>()
        compositionRoot.authorizationProvider = authorizationProvider
        authorizationProvider
          .isAuthorized(endUserId, roomId, authenticationToken)
          .resolves(true)

        // Act
        const result = await audioMetadataQuery(
          testClient,
          userId,
          roomId,
          h5pId,
          h5pSubId,
          {
            authentication: authenticationToken,
          },
        )

        // Assert
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

    context(
      '1 database entry which matches provided arguments; authentication token is undefined',
      () => {
        it('throws authentication error', async () => {
          // Arrange
          const roomId = 'room1'
          const userId = v4()
          const authenticationToken = undefined
          const endUserId = undefined
          const h5pId = 'h5p1'
          const h5pSubId = 'h5pSub1'
          const matchingAudioMetadata = await new AudioMetadataBuilder()
            .withRoomId(roomId)
            .withUserId(userId)
            .withH5pId(h5pId)
            .withH5pSubId(h5pSubId)
            .buildAndPersist()

          const authorizationProvider = Substitute.for<AuthorizationProvider>()
          compositionRoot.authorizationProvider = authorizationProvider
          authorizationProvider
            .isAuthorized(endUserId, roomId, authenticationToken)
            .resolves(true)

          // Act
          const fn = () =>
            audioMetadataQuery(testClient, userId, roomId, h5pId, h5pSubId, {
              authentication: authenticationToken,
            })

          // Assert
          await expect(fn()).to.be.rejectedWith(ErrorMessage.notAuthenticated)
        })
      },
    )
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

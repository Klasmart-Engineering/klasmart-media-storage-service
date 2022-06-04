import '../../../utils/globalIntegrationTestHooks'
import expect from '../../../utils/chaiAsPromisedSetup'
import MediaMetadataBuilder from '../../../builders/mediaMetadataBuilder'
import { generateAuthenticationToken } from '../../../../helpers/generateToken'
import { v4 } from 'uuid'
import { MediaMetadata } from '../../../../src/entities/mediaMetadata'
import ErrorMessage from '../../../../src/errors/errorMessages'
import Substitute from '@fluffy-spoon/substitute'
import AuthorizationProvider from '../../../../src/providers/authorizationProvider'
import { TestCompositionRoot } from '../../testCompositionRoot'
import supertest, { SuperTest } from 'supertest'
import bootstrap from '../../../../src/initialization/bootstrap'
import { MEDIA_METADATA } from '../../../../helpers/queries'

describe('metadataResolver', () => {
  let request: SuperTest<supertest.Test>
  let compositionRoot: TestCompositionRoot
  let requestPath: string

  before(async () => {
    compositionRoot = new TestCompositionRoot()
    const service = await bootstrap(compositionRoot)
    request = supertest(service.server)
    requestPath = service.path
  })

  after(async () => {
    await compositionRoot.cleanUp()
  })

  beforeEach(async () => {
    await compositionRoot.reset()
  })

  describe('mediaMetadata', () => {
    context('0 database entries', () => {
      it('returns empty list', async () => {
        // Arrange
        const roomId = 'room1'
        const userId = v4()
        const endUserId = userId
        const h5pId = 'h5p1'
        const h5pSubId = 'h5pSub1'
        const mediaType = 'image'
        const authenticationToken = generateAuthenticationToken(endUserId)

        const authorizationProvider = Substitute.for<AuthorizationProvider>()
        compositionRoot.authorizationProvider = authorizationProvider
        authorizationProvider
          .isAuthorized(endUserId, roomId, authenticationToken)
          .resolves(true)

        // Act
        const response = await request
          .post(requestPath)
          .set({
            ContentType: 'application/json',
            cookie: `access=${authenticationToken}`,
          })
          .send({
            query: MEDIA_METADATA,
            variables: {
              userId,
              roomId,
              h5pId,
              h5pSubId,
              mediaType,
            },
          })
        const result = response.body.data?.mediaMetadata as MediaMetadata[]

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
        const mediaType = 'image'
        await new MediaMetadataBuilder().buildAndPersist()
        const authenticationToken = generateAuthenticationToken(endUserId)

        const authorizationProvider = Substitute.for<AuthorizationProvider>()
        compositionRoot.authorizationProvider = authorizationProvider
        authorizationProvider
          .isAuthorized(endUserId, roomId, authenticationToken)
          .resolves(true)

        // Act
        const response = await request
          .post(requestPath)
          .set({
            ContentType: 'application/json',
            cookie: `access=${authenticationToken}`,
          })
          .send({
            query: MEDIA_METADATA,
            variables: {
              userId,
              roomId,
              h5pId,
              h5pSubId,
              mediaType,
            },
          })
        const result = response.body.data?.mediaMetadata as MediaMetadata[]

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
        const mediaType = 'audio'
        await new MediaMetadataBuilder().buildAndPersist()
        const matchingAudioMetadata = await new MediaMetadataBuilder()
          .withRoomId(roomId)
          .withUserId(userId)
          .withMimeType('audio/webm')
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
        const response = await request
          .post(requestPath)
          .set({
            ContentType: 'application/json',
            cookie: `access=${authenticationToken}`,
          })
          .send({
            query: MEDIA_METADATA,
            variables: {
              userId,
              roomId,
              h5pId,
              h5pSubId,
              mediaType,
            },
          })
        const result = response.body.data?.mediaMetadata as MediaMetadata[]

        // Assert
        expect(result).to.deep.equal([
          {
            id: matchingAudioMetadata.id,
            userId,
            roomId,
            h5pId,
            h5pSubId,
            createdAt: matchingAudioMetadata.createdAt.toISOString(),
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
          const mediaType = 'audio'
          const matchingAudioMetadata = await new MediaMetadataBuilder()
            .withRoomId(roomId)
            .withUserId(userId)
            .withMimeType('audio/mp4')
            .withH5pId(h5pId)
            .withH5pSubId(h5pSubId)
            .buildAndPersist()

          const authorizationProvider = Substitute.for<AuthorizationProvider>()
          compositionRoot.authorizationProvider = authorizationProvider
          authorizationProvider
            .isAuthorized(endUserId, roomId, authenticationToken)
            .resolves(true)

          // Act
          const response = await request
            .post(requestPath)
            .set({
              ContentType: 'application/json',
              cookie: null,
            })
            .send({
              query: MEDIA_METADATA,
              variables: {
                userId,
                roomId,
                h5pId,
                h5pSubId,
                mediaType,
              },
            })
          expect(response.body?.errors?.[0]?.message).to.equal(
            ErrorMessage.notAuthenticated,
          )
        })
      },
    )
  })
})

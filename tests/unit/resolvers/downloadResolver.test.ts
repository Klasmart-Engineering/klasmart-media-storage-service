import expect from '../../utils/chaiAsPromisedSetup'
import Substitute, { Arg } from '@fluffy-spoon/substitute'
import DownloadResolver from '../../../src/resolvers/downloadResolver'
import { v4 } from 'uuid'
import AuthorizationProvider from '../../../src/providers/authorizationProvider'
import IDownloadInfoProvider from '../../../src/interfaces/downloadInfoProvider'
import ErrorMessage from '../../../src/errors/errorMessages'

describe('DownloadResolver', () => {
  describe('getRequiredDownloadInfo', () => {
    context('valid arguments provided', () => {
      it('returns expected download info', async () => {
        // Arrange
        const downloadInfoProvider = Substitute.for<IDownloadInfoProvider>()
        const authorizationProvider = Substitute.for<AuthorizationProvider>()

        const roomId = 'room1'
        const authenticationToken = 'auth-token'
        const endUserId = v4()
        const mediaId = v4()
        const presignedUrl = 'my-download-url'
        const base64SymmetricKey = 'base64-symmetric-key'

        downloadInfoProvider
          .getDownloadInfo(mediaId, roomId, endUserId)
          .resolves({ base64SymmetricKey, presignedUrl })
        authorizationProvider.isAuthorized(Arg.all()).resolves(true)

        const sut = new DownloadResolver(
          downloadInfoProvider,
          authorizationProvider,
        )

        // Act
        const expected = {
          presignedUrl,
          base64SymmetricKey,
        }
        const actual = await sut.getRequiredDownloadInfo(
          mediaId,
          roomId,
          endUserId,
          authenticationToken,
        )

        // Assert
        expect(actual).to.deep.equal(expected)
      })
    })

    context('endUserId is undefined', () => {
      it('throws UnauthorizedError', async () => {
        // Arrange
        const downloadInfoProvider = Substitute.for<IDownloadInfoProvider>()
        const authorizationProvider = Substitute.for<AuthorizationProvider>()

        const roomId = 'my-room'
        const authenticationToken = 'auth-token'
        const mediaId = v4()
        // ******* main difference ******* //
        const endUserId: string | undefined = undefined
        // ******* main difference ******* //
        authorizationProvider.isAuthorized(Arg.all()).resolves(true)

        const sut = new DownloadResolver(
          downloadInfoProvider,
          authorizationProvider,
        )

        // Act
        const fn = () =>
          sut.getRequiredDownloadInfo(
            mediaId,
            roomId,
            endUserId,
            authenticationToken,
          )

        // Assert
        await expect(fn()).to.be.rejectedWith(ErrorMessage.notAuthenticated)
      })
    })
  })
})

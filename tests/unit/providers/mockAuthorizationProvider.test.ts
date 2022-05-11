import { expect } from 'chai'
import MockAuthorizationProvider from '../../../src/providers/mockAuthorizationProvider'

describe('authorizationProvider', () => {
  describe('isAuthorized', () => {
    context('endUserId is included in the list of teachers for roomId', () => {
      it('returns true', async () => {
        // Arrange
        const endUserId = 'teacher1'
        const roomId = 'my-room'
        const authenticationToken = 'auth-token'
        const sut = new MockAuthorizationProvider()

        // Act
        const actual = await sut.isAuthorized(
          endUserId,
          roomId,
          authenticationToken,
        )

        // Assert
        expect(actual).to.equal(true)
      })
    })

    context('endUserId is undefined', () => {
      it('returns false', async () => {
        // Arrange
        const endUserId = undefined
        const roomId = 'my-room'
        const authenticationToken = 'auth-token'
        const sut = new MockAuthorizationProvider()

        // Act
        const actual = await sut.isAuthorized(
          endUserId,
          roomId,
          authenticationToken,
        )

        // Assert
        expect(actual).to.equal(false)
      })
    })

    context('roomId is undefined', () => {
      it('returns false', async () => {
        // Arrange
        const endUserId = 'teacher1'
        const roomId = undefined
        const authenticationToken = 'auth-token'
        const sut = new MockAuthorizationProvider()

        // Act
        const actual = await sut.isAuthorized(
          endUserId,
          roomId,
          authenticationToken,
        )

        // Assert
        expect(actual).to.equal(false)
      })
    })

    context('authenticationToken is undefined', () => {
      it('returns false', async () => {
        // Arrange
        const endUserId = 'teacher1'
        const roomId = 'my-room'
        const authenticationToken = undefined
        const sut = new MockAuthorizationProvider()

        // Act
        const actual = await sut.isAuthorized(
          endUserId,
          roomId,
          authenticationToken,
        )

        // Assert
        expect(actual).to.equal(false)
      })
    })
  })
})

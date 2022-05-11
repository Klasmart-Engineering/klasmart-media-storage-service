import { expect } from 'chai'
import {
  generateAuthenticationToken,
  generateLiveAuthorizationToken,
} from '../../../helpers/generateToken'
import {
  AuthenticationToken,
  LiveAuthorizationToken,
} from '../../../src/interfaces/tokenParser'
import TokenParser from '../../../src/providers/tokenParser'

describe('TokenParser', () => {
  describe('parseAuthenticationToken', () => {
    context('endUserId is included in the list of teachers for roomId', () => {
      it('returns decoded token', async () => {
        // Arrange
        const userId = 'user1'
        const encodedAuthenticationToken = generateAuthenticationToken(userId)
        const sut = new TokenParser()

        // Act
        const actual = await sut.parseAuthenticationToken(
          encodedAuthenticationToken,
        )

        // Assert
        const expected: AuthenticationToken = { userId }
        expect(actual).to.deep.equal(expected)
      })
    })

    context('invalid encoded token provided', () => {
      it('returns token with undefined properties', async () => {
        // Arrange
        const encodedAuthenticationToken = 'encoded-authentication-token'
        const userId = undefined
        const sut = new TokenParser()

        // Act
        const actual = await sut.parseAuthenticationToken(
          encodedAuthenticationToken,
        )

        // Assert
        const expected: AuthenticationToken = { userId }
        expect(actual).to.deep.equal(expected)
      })
    })

    context('undefined encoded token provided', () => {
      it('returns token with undefined properties', async () => {
        // Arrange
        const encodedAuthenticationToken = undefined
        const userId = undefined
        const sut = new TokenParser()

        // Act
        const actual = await sut.parseAuthenticationToken(
          encodedAuthenticationToken,
        )

        // Assert
        const expected: AuthenticationToken = { userId }
        expect(actual).to.deep.equal(expected)
      })
    })
  })

  describe('parseLiveAuthorizationToken', () => {
    context('endUserId is included in the list of teachers for roomId', () => {
      it('returns decoded token', async () => {
        // Arrange
        const userId = 'user1'
        const roomId = 'room1'
        const encodedAuthorizationToken = generateLiveAuthorizationToken(
          userId,
          roomId,
        )
        const sut = new TokenParser()

        // Act
        const actual = await sut.parseLiveAuthorizationToken(
          encodedAuthorizationToken,
        )

        // Assert
        const expected: LiveAuthorizationToken = { userId, roomId }
        expect(actual).to.deep.equal(expected)
      })
    })

    context('invalid encoded token provided', () => {
      it('returns token with undefined properties', async () => {
        // Arrange
        const encodedAuthorizationToken = 'encoded-authorization-token'
        const userId = undefined
        const roomId = undefined
        const sut = new TokenParser()

        // Act
        const actual = await sut.parseLiveAuthorizationToken(
          encodedAuthorizationToken,
        )

        // Assert
        const expected: LiveAuthorizationToken = { userId, roomId }
        expect(actual).to.deep.equal(expected)
      })
    })

    context('invalid encoded token provided', () => {
      it('returns token with undefined properties', async () => {
        // Arrange
        const encodedAuthorizationToken = undefined
        const userId = undefined
        const roomId = undefined
        const sut = new TokenParser()

        // Act
        const actual = await sut.parseLiveAuthorizationToken(
          encodedAuthorizationToken,
        )

        // Assert
        const expected: LiveAuthorizationToken = { userId, roomId }
        expect(actual).to.deep.equal(expected)
      })
    })
  })
})

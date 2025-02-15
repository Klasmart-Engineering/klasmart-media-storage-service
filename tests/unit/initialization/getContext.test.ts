import { expect } from 'chai'
import { v4 } from 'uuid'
import getContext from '../../../src/initialization/getContext'
import {
  generateAuthenticationToken,
  generateLiveAuthorizationToken,
} from '../../../helpers/generateToken'
import TokenParser from '../../../src/providers/tokenParser'

describe('getContext', () => {
  context(
    'live authorization header is an array rather than a string; second element is not valid',
    () => {
      it('uses first element', async () => {
        const roomId = 'room1'
        const endUserId = v4()
        const tokenParser = new TokenParser()

        const validLiveAuthorizationToken = generateLiveAuthorizationToken(
          endUserId,
          roomId,
        )
        const headers = {
          ContentType: 'application/json',
          cookie: `access=${generateAuthenticationToken(endUserId)}`,
          'live-authorization': [
            validLiveAuthorizationToken,
            'some other value',
          ],
        }

        // Act
        const actual = await getContext(headers, tokenParser)

        // Assert
        expect(actual?.roomId).to.equal(roomId)
      })
    },
  )

  context('cookie is undefined', () => {
    it('returns an empty context object', async () => {
      const roomId = 'room1'
      const tokenParser = new TokenParser()

      const headers = {
        ContentType: 'application/json',
        cookie: undefined,
      }

      // Act
      const actual = await getContext(headers, tokenParser)

      // Assert
      expect(actual).to.deep.equal({})
    })
  })
})

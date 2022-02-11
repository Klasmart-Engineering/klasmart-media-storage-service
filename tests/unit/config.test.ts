import { expect } from 'chai'
import { Config } from '../../src/initialization/config'
import { setEnvVar, restoreEnvVar } from '../utils/setAndRestoreEnvVar'

describe('config', () => {
  describe('getCorsDomain', () => {
    context('DOMAIN is not defined', () => {
      it('throws error with specified message', async () => {
        // Arrange
        const errorMessage = 'DOMAIN must be defined'

        // Act
        const fn = () => Config.getCorsDomain()

        // Assert
        expect(fn).to.throw(errorMessage)
      })
    })

    context('DOMAIN is defined', () => {
      const expected = 'kidsloop.net'
      let original: string | undefined

      before(() => {
        original = setEnvVar('DOMAIN', expected)
      })

      after(() => {
        restoreEnvVar('DOMAIN', original)
      })

      it('returns expected value', async () => {
        // Act
        const actual = Config.getCorsDomain()

        // Assert
        expect(actual).to.equal(expected)
      })
    })
  })
})

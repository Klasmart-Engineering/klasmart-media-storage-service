import { expect } from 'chai'
import { ApplicationError } from '../../../src/errors/applicationError'
import { error2Json, error2Obj } from '../../../src/errors/errorUtil'
import { restoreEnvVar, setEnvVar } from '../../utils/setAndRestoreEnvVar'

describe('errorUtil', () => {
  describe('errorUtil.error2Obj', () => {
    context('error is undefined', () => {
      it('returns undefined', async () => {
        // Arrange
        const error = undefined

        // Act
        const actual = error2Obj(error)

        // Assert
        expect(actual).to.equal(undefined)
      })
    })

    context('error is ApplicationError', () => {
      it('returns expected object', async () => {
        // Arrange
        const error = new ApplicationError('something went wrong')

        // Act
        const actual = error2Obj(error)

        // Assert
        const expected = {
          name: 'ApplicationError',
          message: 'something went wrong',
        }
        expect(actual).to.deep.equal(expected)
      })
    })

    context('error is normal Error; LOG_LEVEL is set to silly', () => {
      let original: string | undefined

      before(() => {
        original = setEnvVar('LOG_LEVEL', 'silly')
      })

      after(() => {
        restoreEnvVar('LOG_LEVEL', original)
      })

      it('returns object with stack trace', async () => {
        // Arrange
        const error = new Error('something went wrong')

        // Act
        const actual = error2Obj(error)

        // Assert
        const expected = {
          name: 'Error',
          message: 'something went wrong',
        }
        expect(actual).to.deep.include(expected)
        expect(actual).to.have.property('stack')
      })
    })
  })

  describe('errorUtil.error2Json', () => {
    context('error is undefined', () => {
      it('returns undefined', async () => {
        // Arrange
        const error = undefined

        // Act
        const actual = error2Json(error)

        // Assert
        expect(actual).to.equal(undefined)
      })
    })

    context('error is ApplicationError', () => {
      it('returns expected json', async () => {
        // Arrange
        const error = new ApplicationError('something went wrong')

        // Act
        const actual = error2Json(error)

        // Assert
        const expected = JSON.stringify({
          name: 'ApplicationError',
          message: 'something went wrong',
        })
        expect(actual).to.deep.equal(expected)
      })
    })
  })
})

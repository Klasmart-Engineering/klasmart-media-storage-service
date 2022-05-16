import { expect } from 'chai'
import s3BodyToBuffer from '../../../src/helpers/s3BodyToBuffer'

describe('s3BodyToBuffer', () => {
  context('argument is not type Readable', () => {
    it('returns undefined', async () => {
      // Act
      const actual = s3BodyToBuffer(undefined)

      // Assert
      expect(actual).to.be.undefined
    })
  })
})

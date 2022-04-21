import expect from '../../utils/chaiAsPromisedSetup'
import { Arg, Substitute } from '@fluffy-spoon/substitute'
import MediaFileStorageChecker from '../../../src/providers/mediaFileStorageChecker'
import UploadValidator from '../../../src/providers/uploadValidator'
import delay from '../../../src/helpers/delay'

describe('UploadValidator.scheduleValidation', () => {
  context('mediaFileStorageChecker.objectExists returns false', () => {
    it('failCallback is not invoked', async () => {
      // Arrange
      const objectKey = 'key1'
      const mediaId = 'media1'
      const fileValidationDelayMs = 1
      const mediaFileStorageChecker = Substitute.for<MediaFileStorageChecker>()
      mediaFileStorageChecker.objectExists(Arg.all()).resolves(false)

      let failCallbackInvoked = false
      const failCallback: (mediaId: string) => Promise<unknown> = (id) => {
        failCallbackInvoked = true
        return Promise.resolve()
      }

      const sut = new UploadValidator(
        mediaFileStorageChecker,
        fileValidationDelayMs,
      )

      // Act
      const expected = true
      sut.scheduleValidation(
        objectKey,
        mediaId,
        {
          h5pId: 'h5p1',
          h5pSubId: null,
          mediaType: 'audio',
          roomId: 'room1',
          userId: 'user1',
        },
        failCallback,
      )
      await delay(2)

      // Assert
      expect(failCallbackInvoked).equal(expected)
    })
  })

  context('mediaFileStorageChecker.objectExists returns undefined', () => {
    it('failCallback is not invoked', async () => {
      // Arrange
      const objectKey = 'key1'
      const mediaId = 'media1'
      const fileValidationDelayMs = 1
      const mediaFileStorageChecker = Substitute.for<MediaFileStorageChecker>()
      mediaFileStorageChecker.objectExists(Arg.all()).resolves(undefined)

      let failCallbackInvoked = false
      const failCallback: (mediaId: string) => Promise<unknown> = (id) => {
        failCallbackInvoked = true
        return Promise.resolve()
      }

      const sut = new UploadValidator(
        mediaFileStorageChecker,
        fileValidationDelayMs,
      )

      // Act
      const expected = false
      sut.scheduleValidation(
        objectKey,
        mediaId,
        {
          h5pId: 'h5p1',
          h5pSubId: null,
          mediaType: 'audio',
          roomId: 'room1',
          userId: 'user1',
        },
        failCallback,
      )
      await delay(2)

      // Assert
      expect(failCallbackInvoked).equal(expected)
    })
  })

  context('mediaFileStorageChecker.objectExists returns true', () => {
    it('failCallback is not invoked', async () => {
      // Arrange
      const objectKey = 'key1'
      const mediaId = 'media1'
      const fileValidationDelayMs = 1
      const mediaFileStorageChecker = Substitute.for<MediaFileStorageChecker>()
      mediaFileStorageChecker.objectExists(Arg.all()).resolves(undefined)

      let failCallbackInvoked = false
      const failCallback: (mediaId: string) => Promise<unknown> = (id) => {
        failCallbackInvoked = true
        return Promise.resolve()
      }

      const sut = new UploadValidator(
        mediaFileStorageChecker,
        fileValidationDelayMs,
      )

      // Act
      const expected = false
      sut.scheduleValidation(
        objectKey,
        mediaId,
        {
          h5pId: 'h5p1',
          h5pSubId: null,
          mediaType: 'audio',
          roomId: 'room1',
          userId: 'user1',
        },
        failCallback,
      )
      await delay(2)

      // Assert
      expect(failCallbackInvoked).equal(expected)
    })
  })
})

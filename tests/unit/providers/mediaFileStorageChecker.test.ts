import expect from '../../utils/chaiAsPromisedSetup'
import { Arg, Substitute } from '@fluffy-spoon/substitute'
import {
  HeadObjectCommand,
  HeadObjectCommandInput,
  S3Client,
} from '@aws-sdk/client-s3'
import { MediaFileStorageChecker } from '../../../src/providers/mediaFileStorageChecker'

describe('MediaFileStorageChecker.objectExists', () => {
  context('s3Client returns metadata for objectKey', () => {
    it('returns true', async () => {
      // Arrange
      const s3Client = Substitute.for<S3Client>()
      const bucketName = 'bucket1'
      const objectKey = 'room1'

      const sut = new MediaFileStorageChecker(s3Client, bucketName)

      const command: any = new HeadObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
      })
      s3Client.send(command).resolves(Arg.any())

      // Act
      const expected = true
      const actual = await sut.objectExists(objectKey)

      // Assert
      expect(actual).equal(expected)
    })
  })

  context('s3Client throws "NotFound" error', () => {
    it('returns false', async () => {
      // Arrange
      const s3Client = Substitute.for<S3Client>()
      const bucketName = 'bucket1'
      const objectKey = 'room1'

      const sut = new MediaFileStorageChecker(s3Client, bucketName)

      s3Client
        .send(
          Arg.is((x) => {
            const input = x.input as HeadObjectCommandInput
            return input.Bucket === bucketName && input.Key === objectKey
          }),
        )
        .rejects(new CustomError('NotFound'))

      // Act
      const expected = false
      const actual = await sut.objectExists(objectKey)

      // Assert
      expect(actual).equal(expected)
    })
  })

  context('s3Client throws error with name not equal to "NotFound"', () => {
    it('returns undefined', async () => {
      // Arrange
      const s3Client = Substitute.for<S3Client>()
      const bucketName = 'bucket1'
      const objectKey = 'room1'

      const sut = new MediaFileStorageChecker(s3Client, bucketName)

      s3Client
        .send(
          Arg.is((x) => {
            const input = x.input as HeadObjectCommandInput
            return input.Bucket === bucketName && input.Key === objectKey
          }),
        )
        .rejects(new CustomError('AccessDenied'))

      // Act
      const expected = undefined
      const actual = await sut.objectExists(objectKey)

      // Assert
      expect(actual).equal(expected)
    })
  })
})

class CustomError extends Error {
  constructor(name: string) {
    super()
    this.name = name
  }
}

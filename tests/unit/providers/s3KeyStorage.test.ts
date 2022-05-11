import Substitute, { Arg } from '@fluffy-spoon/substitute'
import { expect } from 'chai'
import S3KeyStorage from '../../../src/providers/s3KeyStorage'
import {
  GetObjectCommand,
  GetObjectCommandInput,
  PutObjectCommand,
  PutObjectCommandInput,
  S3Client,
} from '@aws-sdk/client-s3'
import { PassThrough } from 'stream'
import delay from '../../../src/helpers/delay'

// TODO: Finish these tests.
describe('S3KeyStorage', () => {
  describe('getKey', () => {
    context('internal s3 error is thrown', () => {
      it('throws the internal s3 error', async () => {
        // Arrange
        const s3Client = Substitute.for<S3Client>()
        const bucketName = 'bucket1'
        const sut = new S3KeyStorage(bucketName, s3Client)

        const s3Error = 'some internal s3 error'
        const objectKey = 'key1'
        s3Client.send(Arg.any()).rejects(s3Error)

        // Act
        const fn = () => sut.getKey(objectKey)

        // Assert
        await expect(fn()).to.be.rejectedWith(s3Error)
      })
    })

    context.skip('key exists', () => {
      it('returns expected key', async () => {
        // Arrange
        const s3Client = Substitute.for<S3Client>()
        const bucketName = 'bucket1'
        const sut = new S3KeyStorage(bucketName, s3Client)

        const s3Error = 'some internal s3 error'
        const objectKey = 'key1'
        const command: any = new GetObjectCommand({
          Bucket: bucketName,
          Key: objectKey,
        })
        const mockedStream = new PassThrough()
        s3Client
          .send(command)
          .resolves({ $metadata: Arg.any(), Body: mockedStream })

        // Act
        // Even with the workaround below, s3BodyToBuffer hangs and the tests times out.
        const task = sut.getKey(objectKey)
        await delay(500)
        mockedStream.emit('data', [1, 2, 3])
        mockedStream.emit('end')
        mockedStream.destroy()
        const actual = await task
        console.log(actual)

        // Assert
        expect(actual == null).to.be.false
      })
    })
  })

  describe.skip('saveKey', () => {
    context('...', () => {
      it('...', async () => {
        // Arrange
        const s3Client = Substitute.for<S3Client>()
        const bucketName = 'bucket1'
        const sut = new S3KeyStorage(bucketName, s3Client)

        const objectKey = 'key1'
        const key = Uint8Array.from([1, 2, 3])

        // Act
        const actual = await sut.saveKey(objectKey, key)

        // Assert
        expect(actual).to.equal(true)
      })
    })
  })
})

import Substitute, { Arg } from '@fluffy-spoon/substitute'
import { expect } from 'chai'
import { v4 } from 'uuid'
import AWS from 'aws-sdk'
import { S3PresignedUrlProvider } from '../../../src/providers/s3PresignedUrlProvider'

describe('S3PresignedUrlProvider', () => {
  describe('getUploadUrl', () => {
    context('0 audio files in storage matching specified mediaId', () => {
      it('returns expected url', async () => {
        // Arrange
        const mediaId = v4()
        const mimeType = 'audio/webm'
        const mediaBucket = 'media-bucket'
        const s3Client = Substitute.for<AWS.S3>()
        const sut = new S3PresignedUrlProvider(mediaBucket, s3Client)

        const expected = 'abc123'
        s3Client
          .getSignedUrlPromise(
            'putObject',
            Arg.is((x) => x.Bucket === mediaBucket && x.Key === mediaId),
          )
          .resolves(expected)

        // Act
        const actual = await sut.getUploadUrl(mediaId, mimeType)

        // Assert
        expect(actual).to.equal(expected)
      })
    })
  })

  describe('getDownloadUrl', () => {
    context('matching audio file exists in storage', () => {
      it('returns expected url', async () => {
        // Arrange
        const mediaId = v4()
        const mediaBucket = 'media-bucket'
        const s3Client = Substitute.for<AWS.S3>()
        const sut = new S3PresignedUrlProvider(mediaBucket, s3Client)

        const expected = 'abc123'
        s3Client
          .getSignedUrlPromise(
            'getObject',
            Arg.is((x) => x.Bucket === mediaBucket && x.Key === mediaId),
          )
          .resolves(expected)

        // Act
        const actual = await sut.getDownloadUrl(mediaId)

        // Assert
        expect(actual).to.equal(expected)
      })
    })
  })
})

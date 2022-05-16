import { expect } from 'chai'
import { v4 } from 'uuid'
import S3PresignedUrlProvider from '../../../src/providers/s3PresignedUrlProvider'
import AppConfig from '../../../src/config/config'
import { restoreEnvVar, setEnvVar } from '../../utils/setAndRestoreEnvVar'

describe('S3PresignedUrlProvider', () => {
  let originalAwsRegion: string | undefined
  let originalAwsId: string | undefined
  let originalAwsSecret: string | undefined
  let originalS3BucketEndpoint: string | undefined

  before(() => {
    originalAwsRegion = setEnvVar('AWS_REGION', 'ap-northeast-2')
    originalAwsId = setEnvVar('AWS_ACCESS_KEY_ID', 'minio')
    originalAwsSecret = setEnvVar('AWS_SECRET_ACCESS_KEY', 'minio123')
    originalS3BucketEndpoint = setEnvVar('S3_BUCKET_ENDPOINT', undefined)
  })

  after(() => {
    restoreEnvVar('AWS_REGION', originalAwsRegion)
    restoreEnvVar('AWS_ACCESS_KEY_ID', originalAwsId)
    restoreEnvVar('AWS_SECRET_ACCESS_KEY', originalAwsSecret)
    restoreEnvVar('S3_BUCKET_ENDPOINT', originalS3BucketEndpoint)
  })

  describe('getUploadUrl', () => {
    it('returns url with expected components', async () => {
      // Arrange
      const mediaId = v4()
      const mimeType = 'audio/webm'
      const mediaBucket = 'media-bucket'
      const s3Client = AppConfig.default.s3Client
      const sut = new S3PresignedUrlProvider(mediaBucket, s3Client)

      // Act
      const actual = await sut.getUploadUrl(mediaId, mimeType)
      const url = new URL(actual)

      // Assert
      const expectedOrigin = 'https://s3.ap-northeast-2.amazonaws.com'
      const expectedPathname = `/${mediaBucket}/${mediaId}`
      expect(url.origin).to.equal(expectedOrigin)
      expect(url.pathname).to.equal(expectedPathname)
      expect(url.searchParams.get('X-Amz-Algorithm')).equal('AWS4-HMAC-SHA256')
      expect(url.searchParams.get('X-Amz-Content-Sha256')).equal(
        'UNSIGNED-PAYLOAD',
      )
      expect(
        url.searchParams
          .get('X-Amz-Credential')
          ?.endsWith('ap-northeast-2/s3/aws4_request'),
      ).to.be.true
      expect(url.searchParams.has('X-Amz-Date')).to.be.true
      expect(url.searchParams.get('X-Amz-Expires')).equal('60')
      expect(url.searchParams.has('X-Amz-Signature')).to.be.true
      expect(url.searchParams.get('X-Amz-SignedHeaders')).equal('host')
      expect(url.searchParams.get('x-id')).equal('PutObject')
    })

    context('CDN downloadUrl is defined', () => {
      it('returns url with expected components; does not use cdn url', async () => {
        // Arrange
        const mediaId = 'abc123'
        const mimeType = 'image/jpg'
        const mediaBucket = 'media-bucket'
        const s3Client = AppConfig.default.s3Client
        const downloadUrl = new URL('https://mycdn.dev')
        const sut = new S3PresignedUrlProvider(
          mediaBucket,
          s3Client,
          downloadUrl,
        )

        // Act
        const actual = await sut.getUploadUrl(mediaId, mimeType)
        const url = new URL(actual)

        // Assert
        const expectedOrigin = 'https://s3.ap-northeast-2.amazonaws.com'
        const expectedPathname = `/${mediaBucket}/${mediaId}`
        expect(url.origin).to.equal(expectedOrigin)
        expect(url.pathname).to.equal(expectedPathname)
        expect(url.searchParams.get('X-Amz-Algorithm')).equal(
          'AWS4-HMAC-SHA256',
        )
        expect(url.searchParams.get('X-Amz-Content-Sha256')).equal(
          'UNSIGNED-PAYLOAD',
        )
        expect(
          url.searchParams
            .get('X-Amz-Credential')
            ?.endsWith('ap-northeast-2/s3/aws4_request'),
        ).to.be.true
        expect(url.searchParams.has('X-Amz-Date')).to.be.true
        expect(url.searchParams.get('X-Amz-Expires')).equal('60')
        expect(url.searchParams.has('X-Amz-Signature')).to.be.true
        expect(url.searchParams.get('X-Amz-SignedHeaders')).equal('host')
        expect(url.searchParams.get('x-id')).equal('PutObject')
      })
    })
  })

  describe('getDownloadUrl', () => {
    it('returns url with expected components', async () => {
      // Arrange
      const mediaId = v4()
      const mediaBucket = 'media-bucket'
      const s3Client = AppConfig.default.s3Client
      const sut = new S3PresignedUrlProvider(mediaBucket, s3Client)

      // Act
      const actual = await sut.getDownloadUrl(mediaId)
      const url = new URL(actual)

      // Assert
      const expectedOrigin = 'https://s3.ap-northeast-2.amazonaws.com'
      const expectedPathname = `/${mediaBucket}/${mediaId}`
      expect(url.origin).to.equal(expectedOrigin)
      expect(url.pathname).to.equal(expectedPathname)
      expect(url.searchParams.get('X-Amz-Algorithm')).equal('AWS4-HMAC-SHA256')
      expect(url.searchParams.get('X-Amz-Content-Sha256')).equal(
        'UNSIGNED-PAYLOAD',
      )
      expect(
        url.searchParams
          .get('X-Amz-Credential')
          ?.endsWith('ap-northeast-2/s3/aws4_request'),
      ).to.be.true
      expect(url.searchParams.has('X-Amz-Date')).to.be.true
      expect(url.searchParams.get('X-Amz-Expires')).equal('900')
      expect(url.searchParams.has('X-Amz-Signature')).to.be.true
      expect(url.searchParams.get('X-Amz-SignedHeaders')).equal('host')
      expect(url.searchParams.get('x-id')).equal('GetObject')
    })

    context('cdn downloadUrl is defined', () => {
      it('returns expected url', async () => {
        // Arrange
        const mediaId = 'abc123'
        const mediaBucket = 'media-bucket'
        const s3Client = AppConfig.default.s3Client
        const downloadUrl = new URL('https://mycdn.dev')
        const sut = new S3PresignedUrlProvider(
          mediaBucket,
          s3Client,
          downloadUrl,
        )

        const expected = 'https://mycdn.dev/' + mediaId

        // Act
        const actual = await sut.getDownloadUrl(mediaId)

        // Assert
        expect(actual).to.equal(expected)
      })
    })
  })
})

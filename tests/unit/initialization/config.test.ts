import { expect } from 'chai'
import { Config } from '../../../src/initialization/config'
import { setEnvVar, restoreEnvVar } from '../../utils/setAndRestoreEnvVar'

// TODO: Consider using contants to refer to environment variable names.
describe('config', () => {
  describe('error should be thrown when required environment variables are not defined', () => {
    const testCases: { [key: string]: () => string } = {
      DOMAIN: () => Config.getCorsDomain(),
      METADATA_DATABASE_URL: () => Config.getMetadataDatabaseUrl(),
      PUBLIC_KEY_BUCKET: () => Config.getPublicKeyBucket(),
      PRIVATE_KEY_BUCKET: () => Config.getPrivateKeyBucket(),
      MEDIA_FILE_BUCKET: () => Config.getMediaFileBucket(),
      CMS_API_URL: () => Config.getCmsApiUrl(),
      USER_SERVICE_ENDPOINT: () => Config.getUserServiceEndpoint(),
    }
    for (const envVar in testCases) {
      context(`${envVar} is not defined`, () => {
        it('throws error with specified message', async () => {
          // Arrange
          const errorMessage = `${envVar} must be defined`

          // Act
          const fn = testCases[envVar]

          // Assert
          expect(fn).to.throw(errorMessage)
        })
      })
    }
  })

  describe('expected values are returned', () => {
    const testCases: {
      [key: string]: { expected: unknown; fn: () => unknown }
    } = {
      CMS_API_URL: {
        expected: 'https://dummy-cms-service.net',
        fn: () => Config.getCmsApiUrl(),
      },
      USER_SERVICE_ENDPOINT: {
        expected: 'https://dummy-user-service.net',
        fn: () => Config.getUserServiceEndpoint(),
      },
      REDIS_HOST: {
        expected: 'dummy-redis-host',
        fn: () => Config.getRedisHost(),
      },
      REDIS_PORT: { expected: 6379, fn: () => Config.getRedisPort() },
    }

    for (const envVar in testCases) {
      context(`${envVar} is defined`, () => {
        const expected = testCases[envVar].expected
        let original: string | undefined

        before(() => {
          original = setEnvVar(envVar, expected as string)
        })

        after(() => {
          restoreEnvVar(envVar, original)
        })

        it('returns expected value', async () => {
          // Act
          const actual = testCases[envVar].fn()

          // Assert
          expect(actual).to.equal(expected)
        })
      })
    }
  })
})

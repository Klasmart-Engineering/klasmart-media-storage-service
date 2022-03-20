import { expect } from 'chai'
import { Config } from '../../../src/initialization/config'
import { setEnvVar, restoreEnvVar } from '../../utils/setAndRestoreEnvVar'

describe('config', () => {
  describe('error should be thrown when required environment variables are not defined', () => {
    const testCases: { [key in keyof NodeJS.ProcessEnv]: () => string } = {
      DOMAIN: () => Config.getCorsDomain(),
      METADATA_DATABASE_URL: () => Config.getMetadataDatabaseUrl(),
      PUBLIC_KEY_BUCKET: () => Config.getPublicKeyBucket(),
      PRIVATE_KEY_BUCKET: () => Config.getPrivateKeyBucket(),
      MEDIA_FILE_BUCKET: () => Config.getMediaFileBucket(),
      CMS_API_URL: () => Config.getCmsApiUrl(),
      USER_SERVICE_ENDPOINT: () => Config.getUserServiceEndpoint(),
    }
    for (const [envVar, fn] of Object.entries(testCases)) {
      context(`${envVar} is not defined`, () => {
        it('throws error with specified message', async () => {
          // Arrange
          const errorMessage = `${envVar} must be defined`

          // Assert
          expect(fn).to.throw(errorMessage)
        })
      })
    }
  })

  describe('expected values are returned', () => {
    const testCases: {
      [key in keyof NodeJS.ProcessEnv]: { expected: unknown; fn: () => unknown }
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

    for (const [key, value] of Object.entries(testCases)) {
      const envVar = key as keyof NodeJS.ProcessEnv
      context(`${envVar} is defined`, () => {
        const expected = value.expected
        let original: string | undefined

        before(() => {
          original = setEnvVar(envVar, expected as string)
        })

        after(() => {
          restoreEnvVar(envVar, original)
        })

        it('returns expected value', async () => {
          // Act
          const actual = value.fn()

          // Assert
          expect(actual).to.equal(expected)
        })
      })
    }
  })
})

import { expect } from 'chai'
import AppConfig from '../../../src/config/config'
import { setEnvVar, restoreEnvVar } from '../../utils/setAndRestoreEnvVar'

describe('config', () => {
  describe('error should be thrown when required environment variables are not defined', () => {
    const testCases: { [key in keyof NodeJS.ProcessEnv]: () => string } = {
      DOMAIN: () => AppConfig.default.corsDomain,
      METADATA_DATABASE_URL: () => AppConfig.default.metadataDatabaseUrl,
      PUBLIC_KEY_BUCKET: () => AppConfig.default.publicKeyBucket,
      PRIVATE_KEY_BUCKET: () => AppConfig.default.privateKeyBucket,
      MEDIA_FILE_BUCKET: () => AppConfig.default.mediaFileBucket,
      CMS_API_URL: () => AppConfig.default.cmsApiUrl,
      USER_SERVICE_ENDPOINT: () => AppConfig.default.userServiceEndpoint,
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
        fn: () => AppConfig.default.cmsApiUrl,
      },
      USER_SERVICE_ENDPOINT: {
        expected: 'https://dummy-user-service.net',
        fn: () => AppConfig.default.userServiceEndpoint,
      },
      REDIS_HOST: {
        expected: 'dummy-redis-host',
        fn: () => AppConfig.default.redisHost,
      },
      REDIS_PORT: { expected: 6379, fn: () => AppConfig.default.redisPort },
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

  describe('getCache', () => {
    context(`CACHE is set to invalid value`, () => {
      let original: string | undefined

      before(() => {
        original = setEnvVar('CACHE', 'custom')
      })

      after(() => {
        restoreEnvVar('CACHE', original)
      })

      it('throws "invalid value" error', async () => {
        // Act
        const fn = () => AppConfig.default.cache

        // Assert
        expect(fn).to.throw(
          "Invalid value for CACHE. Valid options: 'redis', 'memory', or undefined",
        )
      })
    })
  })

  describe('getRedisHost', () => {
    context(`CACHE is set to 'redis' but REDIS_HOST is not set`, () => {
      let cacheOriginal: string | undefined
      let hostOriginal: string | undefined
      let portOriginal: string | undefined

      before(() => {
        cacheOriginal = setEnvVar('CACHE', 'redis')
        hostOriginal = setEnvVar('REDIS_HOST', undefined)
        portOriginal = setEnvVar('REDIS_PORT', '6379')
      })

      after(() => {
        restoreEnvVar('CACHE', cacheOriginal)
        restoreEnvVar('REDIS_HOST', hostOriginal)
        restoreEnvVar('REDIS_PORT', portOriginal)
      })

      it('throws "required" error', async () => {
        // Act
        const fn = () => AppConfig.default.redisHost

        // Assert
        expect(fn).to.throw(
          "REDIS_HOST must be defined if CACHE is set to 'redis'",
        )
      })
    })
  })

  describe('getRedisPort', () => {
    context(`CACHE is set to 'redis' but REDIS_PORT is not set`, () => {
      let cacheOriginal: string | undefined
      let hostOriginal: string | undefined
      let portOriginal: string | undefined

      before(() => {
        cacheOriginal = setEnvVar('CACHE', 'redis')
        hostOriginal = setEnvVar('REDIS_HOST', 'localhost')
        portOriginal = setEnvVar('REDIS_PORT', undefined)
      })

      after(() => {
        restoreEnvVar('CACHE', cacheOriginal)
        restoreEnvVar('REDIS_HOST', hostOriginal)
        restoreEnvVar('REDIS_PORT', portOriginal)
      })

      it('throws "required" error', async () => {
        // Act
        const fn = () => AppConfig.default.redisPort

        // Assert
        expect(fn).to.throw(
          "REDIS_PORT must be defined if CACHE is set to 'redis'",
        )
      })
    })

    context(`REDIS_PORT is set to invalid value`, () => {
      let original: string | undefined

      before(() => {
        original = setEnvVar('REDIS_PORT', 'custom')
      })

      after(() => {
        restoreEnvVar('REDIS_PORT', original)
      })

      it('throws "NaN" error', async () => {
        // Act
        const fn = () => AppConfig.default.redisPort

        // Assert
        expect(fn).to.throw('REDIS_PORT is NaN')
      })
    })
  })
})

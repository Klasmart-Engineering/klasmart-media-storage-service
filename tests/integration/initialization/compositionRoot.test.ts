import '../../utils/globalIntegrationTestHooks'
import { expect } from 'chai'
import CompositionRoot from '../../../src/initialization/compositionRoot'
import { restoreEnvVar, setEnvVar } from '../../utils/setAndRestoreEnvVar'
import TestAppConfig from '../../builders/testAppConfig'
import delay from '../../../src/helpers/delay'
import { StatsProvider } from '../../../src/providers/statsProvider'
import Substitute, { Arg } from '@fluffy-spoon/substitute'

describe('compositionRoot', () => {
  let compositionRoot: CompositionRoot

  describe('buildObjectGraph', () => {
    context('default configuration', () => {
      before(async () => {
        compositionRoot = new CompositionRoot()
      })

      after(async () => {
        await compositionRoot.cleanUp()
      })

      it('no errors are thrown', async () => {
        await compositionRoot.buildObjectGraph()
      })
    })

    context('object graph already built', () => {
      before(async () => {
        compositionRoot = new CompositionRoot()
        await compositionRoot.buildObjectGraph()
      })

      after(async () => {
        await compositionRoot.cleanUp()
      })

      it('authorizationProvider is not reinstantiated', async () => {
        const authorizationProvider = compositionRoot['authorizationProvider']
        expect(authorizationProvider).to.equal(
          compositionRoot['getAuthorizationProvider'](),
        )
      })

      it('symmetricKeyProvider is not reinstantiated', async () => {
        const symmetricKeyProvider = compositionRoot['symmetricKeyProvider']
        expect(symmetricKeyProvider).to.equal(
          compositionRoot['getSymmetricKeyProvider'](),
        )
      })
    })

    context('MOCK_WEB_APIS is set to false', () => {
      let mockOriginal: string | undefined

      before(async () => {
        compositionRoot = new CompositionRoot()
        mockOriginal = setEnvVar('MOCK_WEB_APIS', 'false')
      })

      after(async () => {
        restoreEnvVar('MOCK_WEB_APIS', mockOriginal)
        await compositionRoot.cleanUp()
      })

      it('no errors are thrown', async () => {
        await compositionRoot.buildObjectGraph()
      })
    })

    context('CACHE is undefined', () => {
      let cacheOriginal: string | undefined

      before(async () => {
        compositionRoot = new CompositionRoot()
        cacheOriginal = setEnvVar('CACHE', undefined)
      })

      after(async () => {
        restoreEnvVar('CACHE', cacheOriginal)
        await compositionRoot.cleanUp()
      })

      it('no errors are thrown', async () => {
        await compositionRoot.buildObjectGraph()
      })
    })

    context('call getMetadataRepository after shutDown', () => {
      before(async () => {
        compositionRoot = new CompositionRoot()
        await compositionRoot.buildObjectGraph()
      })

      it('throws typeorm error', async () => {
        await compositionRoot.shutDown()
        const fn = () => compositionRoot['getMetadataRepository']()
        expect(fn).to.throw('typeorm should have been instantiated by now.')
      })
    })
  })

  describe('shutDown', () => {
    context(
      "CACHE is set to 'redis', and REDIS_HOST and REDIS_PORT are defined",
      () => {
        let cacheOriginal: string | undefined
        let redisHostOriginal: string | undefined
        let redisPortOriginal: string | undefined

        before(async () => {
          cacheOriginal = setEnvVar('CACHE', 'redis')
          redisHostOriginal = setEnvVar('REDIS_HOST', 'localhost')
          redisPortOriginal = setEnvVar('REDIS_PORT', '6379')
        })

        after(async () => {
          restoreEnvVar('CACHE', cacheOriginal)
          restoreEnvVar('REDIS_HOST', redisHostOriginal)
          restoreEnvVar('REDIS_PORT', redisPortOriginal)
        })

        afterEach(async () => {
          await compositionRoot.cleanUp()
        })

        // TODO: Verify calls and/or effects.
        it('no errors are thrown', async () => {
          compositionRoot = new CompositionRoot()
          await compositionRoot.buildObjectGraph()
          await compositionRoot.shutDown()
        })

        context('statsProvider.appendToSharedStorage throws an error', () => {
          it('error is caught and logged', async () => {
            compositionRoot = new StatsCompositionRoot2()
            await compositionRoot.buildObjectGraph()
            await compositionRoot.shutDown()
          })
        })
      },
    )

    context('call cleanUp without building object graph', () => {
      before(async () => {
        compositionRoot = new CompositionRoot()
      })

      it('no errors are thrown', async () => {
        await compositionRoot.cleanUp()
      })
    })
  })

  describe('periodicScheduler', () => {
    context(
      "CACHE is set to 'redis', and REDIS_HOST and REDIS_PORT are defined",
      () => {
        let cacheOriginal: string | undefined
        let redisHostOriginal: string | undefined
        let redisPortOriginal: string | undefined

        before(async () => {
          cacheOriginal = setEnvVar('CACHE', 'redis')
          redisHostOriginal = setEnvVar('REDIS_HOST', 'localhost')
          redisPortOriginal = setEnvVar('REDIS_PORT', '6379')
        })

        after(async () => {
          restoreEnvVar('CACHE', cacheOriginal)
          restoreEnvVar('REDIS_HOST', redisHostOriginal)
          restoreEnvVar('REDIS_PORT', redisPortOriginal)
        })

        afterEach(async () => {
          await compositionRoot.cleanUp()
        })

        // TODO: Verify calls and/or effects.
        it('no errors are thrown', async () => {
          const config = new TestAppConfig().withStatsLogConfig({
            offset: 50,
            period: 100,
          })
          compositionRoot = new StatsCompositionRoot(config)
          await compositionRoot.buildObjectGraph()
          await delay(200)
          if (compositionRoot['periodicScheduler']) {
            clearTimeout(compositionRoot['periodicScheduler'])
          }
          // Give the Redis operation time to finish.
          await delay(200)
        })

        context('statsProvider.calculateTotals throws an error', () => {
          it('error is caught and logged', async () => {
            const config = new TestAppConfig().withStatsLogConfig({
              offset: 50,
              period: 10000,
            })
            compositionRoot = new StatsCompositionRoot2(config)
            await compositionRoot.buildObjectGraph()
            await delay(100)
          })
        })
      },
    )

    context("CACHE is set to 'memory'", () => {
      let cacheOriginal: string | undefined

      before(async () => {
        cacheOriginal = setEnvVar('CACHE', 'memory')
      })

      after(async () => {
        restoreEnvVar('CACHE', cacheOriginal)
      })

      afterEach(async () => {
        await compositionRoot.cleanUp()
      })

      // TODO: Verify calls and/or effects.
      it('no errors are thrown', async () => {
        const config = new TestAppConfig().withStatsLogConfig({
          offset: 50,
          period: 100,
        })
        compositionRoot = new StatsCompositionRoot(config)
        await compositionRoot.buildObjectGraph()
        compositionRoot.getTokenParser()
        await delay(200)
      })
    })
  })
})

class StatsCompositionRoot extends CompositionRoot {
  protected getStatsProvider(): StatsProvider | undefined {
    return new StatsProvider(super.getRedisClient(), 1)
  }
}

class StatsCompositionRoot2 extends CompositionRoot {
  protected getStatsProvider(): StatsProvider | undefined {
    const mock = Substitute.for<StatsProvider>()
    mock.calculateTotals(Arg.all()).rejects(new Error('oops'))
    mock.appendToSharedStorage(Arg.all()).rejects(new Error('oops'))
    return mock
  }
}

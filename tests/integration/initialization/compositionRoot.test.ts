import '../../utils/globalIntegrationTestHooks'
import { expect } from 'chai'
import CompositionRoot from '../../../src/initialization/compositionRoot'
import { restoreEnvVar, setEnvVar } from '../../utils/setAndRestoreEnvVar'

describe('compositionRoot.buildObjectGraph', () => {
  let compositionRoot: CompositionRoot

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

  context(
    "CACHE is set to 'redis', and REDIS_HOST and REDIS_PORT are defined",
    () => {
      let cacheOriginal: string | undefined
      let redisHostOriginal: string | undefined
      let redisPortOriginal: string | undefined

      before(async () => {
        compositionRoot = new CompositionRoot()
        cacheOriginal = setEnvVar('CACHE', 'redis')
        redisHostOriginal = setEnvVar('REDIS_HOST', 'my-host')
        redisPortOriginal = setEnvVar('REDIS_PORT', '6379')
      })

      after(async () => {
        restoreEnvVar('CACHE', cacheOriginal)
        restoreEnvVar('REDIS_HOST', redisHostOriginal)
        restoreEnvVar('REDIS_PORT', redisPortOriginal)
        await compositionRoot.cleanUp()
      })

      it('no errors are thrown', async () => {
        await compositionRoot.buildObjectGraph()
      })
    },
  )

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
})

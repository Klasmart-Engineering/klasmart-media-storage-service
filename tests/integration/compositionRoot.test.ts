import '../utils/globalIntegrationTestHooks'
import { expect } from 'chai'
import { CompositionRoot } from '../../src/initialization/compositionRoot'
import { restoreEnvVar, setEnvVar } from '../utils/setAndRestoreEnvVar'

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

  context('REDIS_HOST and REDIS_PORT are defined', () => {
    let redisHostOriginal: string | undefined
    let redisPortOriginal: string | undefined

    before(async () => {
      compositionRoot = new CompositionRoot()
      redisHostOriginal = setEnvVar('REDIS_HOST', 'my-host')
      redisPortOriginal = setEnvVar('REDIS_PORT', '6379')
    })

    after(async () => {
      restoreEnvVar('REDIS_HOST', redisHostOriginal)
      restoreEnvVar('REDIS_PORT', redisPortOriginal)
      await compositionRoot.cleanUp()
    })

    it('no errors are thrown', async () => {
      await compositionRoot.buildObjectGraph()
    })
  })

  context('REDIS_HOST is defined but REDIS_PORT is not', () => {
    let redisHostOriginal: string | undefined

    before(async () => {
      compositionRoot = new CompositionRoot()
      redisHostOriginal = setEnvVar('REDIS_HOST', 'my-host')
    })

    after(async () => {
      restoreEnvVar('REDIS_HOST', redisHostOriginal)
      await compositionRoot.cleanUp()
    })

    it('no errors are thrown', async () => {
      await compositionRoot.buildObjectGraph()
    })
  })
})

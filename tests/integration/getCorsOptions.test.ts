import '../utils/globalIntegrationTestHooks'
import expect from '../utils/chaiAsPromisedSetup'
import { TestCompositionRoot } from './testCompositionRoot'
import bootstrap from '../../src/initialization/bootstrap'
import supertest, { SuperTest } from 'supertest'
import { restoreEnvVar, setEnvVar } from '../utils/setAndRestoreEnvVar'

describe('cors DOMAIN is set to kidsloop.net', () => {
  let request: SuperTest<supertest.Test>
  let compositionRoot: TestCompositionRoot
  let original: string | undefined

  before(async () => {
    compositionRoot = new TestCompositionRoot()
    original = setEnvVar('DOMAIN', 'kidsloop.net')
    const service = await bootstrap(compositionRoot)
    request = supertest(service.server)
  })

  after(async () => {
    restoreEnvVar('DOMAIN', original)
    await compositionRoot.cleanUp()
  })

  context('origin is https://kidsloop.net', () => {
    it('response.headers reflects our cors config', async () => {
      const response = await request
        .get('/health')
        .set({
          Origin: 'https://kidsloop.net',
        })
        .expect('Access-Control-Allow-Credentials', 'true')
    })
  })

  context('origin is https://kidsloop.com', () => {
    it('response.headers does not have key Access-Control-Allow-Origin', async () => {
      const response = await request.get('/health').set({
        Origin: 'https://kidsloop.com',
      })
      expect(response.headers).to.not.have.key('Access-Control-Allow-Origin')
    })
  })

  const permittedOrigins = [
    'http://kidsloop.net',
    'https://kidsloop.net',
    'https://hub.kidsloop.net',
    'https://hub.alpha.kidsloop.net',
    'https://kidsloop.net:8080',
  ]
  for (const origin of permittedOrigins) {
    context(`origin: ${origin}`, () => {
      it(`response.headers Access-Control-Allow-Origin is equal to ${origin}`, async () => {
        await request
          .get('/health')
          .set({
            Origin: origin,
          })
          .expect('Access-Control-Allow-Origin', origin)
      })
    })
  }
})

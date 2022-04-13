import '../../utils/globalIntegrationTestHooks'
import { expect } from 'chai'
import { TestCompositionRoot } from '../testCompositionRoot'
import bootstrap from '../../../src/initialization/bootstrap'
import { restoreEnvVar, setEnvVar } from '../../utils/setAndRestoreEnvVar'

describe('createApolloExpressService', () => {
  let compositionRoot: TestCompositionRoot
  let originalServerImpl: string | undefined

  before(async () => {
    originalServerImpl = setEnvVar('SERVER_IMPL', 'apollo-express')
  })

  after(async () => {
    restoreEnvVar('SERVER_IMPL', originalServerImpl)
    await compositionRoot?.cleanUp()
  })

  context('SERVER_IMPL is set to apollo-express', () => {
    it('result is not nullish', async () => {
      compositionRoot = new TestCompositionRoot()
      const service = await bootstrap(compositionRoot)
      expect(service == null).to.be.false
      expect(service.path == null).to.be.false
      expect(service.server == null).to.be.false
    })
  })
})

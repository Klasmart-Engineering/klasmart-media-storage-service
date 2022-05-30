import '../../utils/globalIntegrationTestHooks'
import { expect } from 'chai'
import { TestCompositionRoot } from '../testCompositionRoot'
import bootstrap from '../../../src/initialization/bootstrap'
import { restoreEnvVar, setEnvVar } from '../../utils/setAndRestoreEnvVar'
import buildDefaultSchema from '../../../src/initialization/buildDefaultSchema'
import createApolloExpressService from '../../../src/initialization/createApolloExpressService'
import supertest from 'supertest'
import { version } from '../../../package.json'
import IMediaStorageService from '../../../src/interfaces/mediaStorageService'
import { posix } from 'path'

describe('createApolloExpressService', () => {
  let originalServerImpl: string | undefined

  before(async () => {
    originalServerImpl = setEnvVar('SERVER_IMPL', 'apollo-express')
  })

  after(async () => {
    restoreEnvVar('SERVER_IMPL', originalServerImpl)
  })

  context('SERVER_IMPL is set to apollo-express', () => {
    let compositionRoot: TestCompositionRoot

    after(async () => {
      await compositionRoot?.cleanUp()
    })

    it('result is not nullish', async () => {
      compositionRoot = new TestCompositionRoot()
      const service = await bootstrap(compositionRoot)
      expect(service == null).to.be.false
      expect(service.path == null).to.be.false
      expect(service.server == null).to.be.false
    })
  })

  context('call service.listen and service.close', () => {
    let compositionRoot: TestCompositionRoot
    let service: IMediaStorageService

    after(async () => {
      await service.close()
      await compositionRoot.cleanUp()
    })

    it('service.listen callback executes', async () => {
      // Arrange
      compositionRoot = new TestCompositionRoot()
      const schema = await buildDefaultSchema(compositionRoot)
      service = await createApolloExpressService(schema, compositionRoot)

      // Act
      let callbackInvoked = false
      await service.listen(8080, () => {
        callbackInvoked = true
      })

      // Assert
      expect(callbackInvoked).to.be.true
    })
  })

  context('call version endpoint', () => {
    let compositionRoot: TestCompositionRoot

    after(async () => {
      await compositionRoot.cleanUp()
    })

    it('returns 200 and version matching package.json', async () => {
      // Arrange
      compositionRoot = new TestCompositionRoot()
      const schema = await buildDefaultSchema(compositionRoot)
      const service = await createApolloExpressService(schema, compositionRoot)
      const request = supertest(service.server)
      const versionPath = posix.join(process.env.ROUTE_PREFIX ?? '', '/version')

      // Act
      const response = await request.get(versionPath).send().expect(200)

      // Assert
      expect(response.body.version).to.equal(version)
    })
  })

  context('call health endpoint', () => {
    let compositionRoot: TestCompositionRoot

    after(async () => {
      await compositionRoot.cleanUp()
    })

    it('returns 200', async () => {
      // Arrange
      compositionRoot = new TestCompositionRoot()
      const schema = await buildDefaultSchema(compositionRoot)
      const service = await createApolloExpressService(schema, compositionRoot)
      const request = supertest(service.server)

      // Act & Assert
      const response = await request.get('/health').send().expect(200)
    })
  })

  context('ROUTE_PREFIX not defined', () => {
    let compositionRoot: TestCompositionRoot
    let originalPrefix: string | undefined

    before(() => {
      originalPrefix = setEnvVar('ROUTE_PREFIX', undefined)
    })

    after(async () => {
      restoreEnvVar('ROUTE_PREFIX', originalPrefix)
      await compositionRoot.cleanUp()
    })

    it("graphql path equals '/graphql'", async () => {
      // Arrange
      compositionRoot = new TestCompositionRoot()
      const schema = await buildDefaultSchema(compositionRoot)

      // Act
      const service = await createApolloExpressService(schema, compositionRoot)

      // Assert
      expect(service.path).to.equal('/graphql')
    })
  })
})
